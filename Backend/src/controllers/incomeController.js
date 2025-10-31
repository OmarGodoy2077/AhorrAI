const { Income } = require('../models');

const IncomeController = {
    async createIncome(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            if (data.account_id === '') {
                data.account_id = null;
            }
            if (data.currency_id === '') {
                data.currency_id = null;
            }
            const income = await Income.create(data);
            res.status(201).json(income);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getIncomes(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const result = await Income.findByUserId(req.user.userId, { limit: parseInt(limit), offset: parseInt(offset), sortBy, sortOrder });
            res.json({ data: result.data, page: parseInt(page), limit: parseInt(limit), total: result.total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            res.json(income);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            const updates = { ...req.body };
            if (updates.account_id === '') {
                updates.account_id = null;
            }
            if (updates.currency_id === '') {
                updates.currency_id = null;
            }
            const updatedIncome = await Income.update(req.params.id, updates);
            res.json(updatedIncome);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }

            // If this is a confirmed generated salary income, revert the schedule state
            if (income.is_confirmed && income.description && income.description.includes('Generado desde:')) {
                const database = require('../config').database;
                const userId = req.user.userId;

                // Extract schedule name from description: "Generado desde: ScheduleName - frequency"
                const scheduleNameMatch = income.description.match(/Generado desde:\s*([^-\s]+)/);
                if (scheduleNameMatch) {
                    const scheduleName = scheduleNameMatch[1];

                    // Find the corresponding salary schedule
                    const { data: schedule } = await database
                        .from('salary_schedules')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('name', scheduleName)
                        .eq('is_active', true)
                        .single();

                    if (schedule) {
                        // Calculate what the next_generation_date should be if we revert this confirmation
                        // Set it back to the date of the income being deleted
                        const incomeDate = new Date(income.income_date);
                        
                        // For monthly schedules, set next_generation_date to the income date
                        // This will allow regeneration of this specific month's income
                        const revertedNextGenerationDate = income.income_date;

                        // Update the salary schedule to revert the state
                        await database
                            .from('salary_schedules')
                            .update({
                                next_generation_date: revertedNextGenerationDate,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', schedule.id);
                    }
                }
            }

            // Allow deletion of any income (confirmed or not)
            await Income.delete(req.params.id);
            res.json({ message: 'Income deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async confirmIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }

            // Check if this is a generated salary income
            if (income.description && income.description.includes('Generado desde:')) {
                const database = require('../config').database;
                const userId = req.user.userId;

                // Extract schedule name from description: "Generado desde: ScheduleName - frequency"
                const scheduleNameMatch = income.description.match(/Generado desde:\s*([^-\s]+)/);
                if (scheduleNameMatch) {
                    const scheduleName = scheduleNameMatch[1];

                    // Find the corresponding salary schedule
                    const { data: schedule } = await database
                        .from('salary_schedules')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('name', scheduleName)
                        .eq('is_active', true)
                        .single();

                    if (schedule) {
                        // Calculate next generation date based on the confirmed income date
                        const confirmedDate = new Date(income.income_date);
                        let nextGenerationDate;

                        if (schedule.frequency === 'monthly') {
                            // Move to next month, same day
                            nextGenerationDate = new Date(confirmedDate);
                            nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                        } else if (schedule.frequency === 'weekly') {
                            // Move to next week, same day of week
                            nextGenerationDate = new Date(confirmedDate);
                            nextGenerationDate.setDate(nextGenerationDate.getDate() + 7);
                        }

                        if (nextGenerationDate) {
                            // Update the salary schedule with the new next_generation_date
                            await database
                                .from('salary_schedules')
                                .update({
                                    next_generation_date: nextGenerationDate.toISOString().split('T')[0],
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', schedule.id);
                        }
                    }
                }
            }

            // Mark income as confirmed
            const confirmedIncome = await Income.confirm(req.params.id);
            res.json(confirmedIncome);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async generateSalaryIncomes(req, res) {
        try {
            const database = require('../config').database;
            const userId = req.user.userId;
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];
            
            // Function to get month name in Spanish
            const getMonthName = (monthIndex) => {
                const months = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ];
                return months[monthIndex];
            };
            
            // Find all active salary schedules of type 'fixed' (only fixed salaries generate automatic incomes)
            const { data: salarySchedules, error } = await database
                .from('salary_schedules')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .eq('type', 'fixed');
                
            if (error) throw error;
            
            const generatedIncomes = [];
            
            for (const schedule of salarySchedules) {
                // Calculate all payment dates from start_date to today that don't have incomes yet
                const startDate = new Date(schedule.start_date);
                const paymentDates = [];
                
                if (schedule.frequency === 'monthly') {
                    // Generate monthly payment dates
                    let currentPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), schedule.salary_day);
                    
                    // If salary day is before start date in that month, move to next month
                    if (currentPaymentDate < startDate) {
                        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 1);
                    }
                    
                    // Generate all payment dates up to today
                    while (currentPaymentDate <= now) {
                        paymentDates.push(new Date(currentPaymentDate));
                        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 1);
                    }
                    
                } else if (schedule.frequency === 'weekly') {
                    // Generate weekly payment dates
                    const startDayOfWeek = startDate.getDay();
                    const targetDayOfWeek = schedule.salary_day;
                    
                    let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
                    if (daysToAdd === 0) daysToAdd = 7; // If same day, move to next week
                    
                    let currentPaymentDate = new Date(startDate);
                    currentPaymentDate.setDate(startDate.getDate() + daysToAdd);
                    
                    // Generate all payment dates up to today
                    while (currentPaymentDate <= now) {
                        paymentDates.push(new Date(currentPaymentDate));
                        currentPaymentDate.setDate(currentPaymentDate.getDate() + 7);
                    }
                }
                
                // Generate incomes for dates that don't exist yet
                for (const paymentDate of paymentDates) {
                    const paymentDateStr = paymentDate.toISOString().split('T')[0];
                    
                    // Create descriptive name with month
                    const monthName = getMonthName(paymentDate.getMonth());
                    const incomeName = `Salario mes de ${monthName}`;
                    
                    // Check if income already exists for this date and schedule
                    const { data: existingData } = await database
                        .from('income_sources')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('name', incomeName)
                        .eq('income_date', paymentDateStr);
                    
                    // Only generate if no income exists for this exact period
                    if (!existingData || existingData.length === 0) {
                        // Generate new income entry
                        const newIncome = {
                            user_id: userId,
                            name: incomeName,
                            type: 'fixed',
                            amount: schedule.amount,
                            currency_id: schedule.currency_id,
                            frequency: 'one-time', // Generated incomes are one-time
                            income_date: paymentDateStr,
                            description: `Generado desde: ${schedule.name} - ${schedule.frequency}`,
                            account_id: schedule.account_id,
                            is_confirmed: false, // Generated incomes need confirmation
                            is_salary: true // Mark as generated salary
                        };
                        
                        const createdIncome = await Income.create(newIncome);
                        generatedIncomes.push(createdIncome);
                    }
                }
                
                // Update the salary schedule with new generation dates
                // Find the next future payment date after today
                let nextGenerationDate;
                if (schedule.frequency === 'monthly') {
                    const lastPayment = paymentDates[paymentDates.length - 1] || new Date(schedule.start_date);
                    nextGenerationDate = new Date(lastPayment);
                    nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                } else if (schedule.frequency === 'weekly') {
                    const lastPayment = paymentDates[paymentDates.length - 1] || new Date(schedule.start_date);
                    nextGenerationDate = new Date(lastPayment);
                    nextGenerationDate.setDate(nextGenerationDate.getDate() + 7);
                }
                
                // Update the schedule
                await database
                    .from('salary_schedules')
                    .update({
                        last_generated_date: currentDate,
                        next_generation_date: nextGenerationDate.toISOString().split('T')[0],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', schedule.id);
            }
            
            res.json({ 
                message: `Generated ${generatedIncomes.length} income entries`,
                generated: generatedIncomes 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getSalaryConfirmationPeriod(req, res) {
        try {
            const database = require('../config').database;
            const userId = req.user.userId;
            const { period_type } = req.query; // 'monthly' or 'biweekly'
            
            if (!period_type || !['monthly', 'biweekly'].includes(period_type)) {
                return res.status(400).json({ error: 'Invalid period_type. Use "monthly" or "biweekly"' });
            }

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            // Calculate period dates
            let periodStart, periodEnd;
            if (period_type === 'monthly') {
                periodStart = new Date(currentYear, now.getMonth(), 1).toISOString().split('T')[0];
                periodEnd = new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (period_type === 'biweekly') {
                const dayOfMonth = now.getDate();
                if (dayOfMonth <= 15) {
                    periodStart = new Date(currentYear, now.getMonth(), 1).toISOString().split('T')[0];
                    periodEnd = new Date(currentYear, now.getMonth(), 15).toISOString().split('T')[0];
                } else {
                    periodStart = new Date(currentYear, now.getMonth(), 16).toISOString().split('T')[0];
                    periodEnd = new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];
                }
            }

            // Get fixed salary sources (CONFIRMABLE manually)
            const { data: fixedSalaries } = await database
                .from('income_sources')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'fixed');

            // Get variable/average salary sources (INDEX ONLY - not confirmable)
            const { data: averageSalaries } = await database
                .from('income_sources')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'variable');

            // Get ACTUAL income entries (extras/other incomes) within the period
            // This is what counts for the average calculation
            const { data: periodIncomes } = await database
                .from('income_sources')
                .select('*')
                .eq('user_id', userId)
                .gte('income_date', periodStart)
                .lte('income_date', periodEnd)
                .eq('type', 'extra'); // Only 'extra' type incomes count for average

            // Calculate totals
            const totalActualIncome = periodIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
            
            // Average salary expected is just an index
            const averageExpected = averageSalaries.length > 0
                ? averageSalaries.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0) / averageSalaries.length
                : 0;

            // Status for average salary card
            const averageStatus = totalActualIncome >= averageExpected ? 'met' : totalActualIncome > 0 ? 'partial' : 'pending';

            res.json({
                period_type,
                period_start: periodStart,
                period_end: periodEnd,
                fixed_salaries: fixedSalaries.map(s => ({
                    id: s.id,
                    name: s.name,
                    amount: s.amount,
                    is_confirmed: s.is_confirmed,
                    confirmed_at: s.confirmed_at
                })),
                average_salary: {
                    sources: averageSalaries.map(s => ({
                        id: s.id,
                        name: s.name,
                        expected_amount: s.amount
                    })),
                    expected_average: averageExpected,
                    actual_income: totalActualIncome,
                    difference: totalActualIncome - averageExpected,
                    status: averageStatus, // met, partial, pending
                    detail: `Basado en ${periodIncomes.length} ingresos extras este período`
                },
                period_incomes: periodIncomes
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createSalaryConfirmation(req, res) {
        try {
            const database = require('../config').database;
            const userId = req.user.userId;
            const { income_source_id } = req.body;

            // Get the income source
            const income = await Income.findById(income_source_id);
            if (!income || income.user_id !== userId) {
                return res.status(404).json({ error: 'Income source not found' });
            }

            // Only FIXED salaries can be manually confirmed
            if (income.type !== 'fixed') {
                return res.status(400).json({ error: 'Only fixed salary incomes can be confirmed manually. Average salaries are index-only.' });
            }

            // Use the confirmIncome method instead (simpler for fixed salaries)
            const confirmedIncome = await Income.confirm(income_source_id);
            
            res.status(200).json({
                message: 'Salary confirmed successfully',
                income: confirmedIncome
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = IncomeController;