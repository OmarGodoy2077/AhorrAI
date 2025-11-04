const { Income } = require('../models');
const { getTodayGuatemalaString, getNowGuatemala, getTodayDayOfMonth, parseGuatemalaDate, isDateTodayOrPast } = require('../utils/dateUtils');

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

            // If this is a generated salary income, we can allow deletion
            // The schedule will handle regeneration if needed
            if (income.description && income.description.includes('Generado desde:')) {
                const database = require('../config').database;
                const userId = req.user.userId;

                // Extract schedule name from description: "Generado desde: ScheduleName - frequency"
                const scheduleNameMatch = income.description.match(/Generado desde:\s*([^-]+)/);
                if (scheduleNameMatch) {
                    const scheduleName = scheduleNameMatch[1].trim();

                    // Find the corresponding salary schedule
                    const { data: schedule } = await database
                        .from('salary_schedules')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('name', scheduleName)
                        .eq('is_active', true)
                        .single();

                    if (schedule && income.is_confirmed) {
                        // Only revert schedule state if the income was confirmed
                        // Calculate what the next_generation_date should be
                        const incomeDate = new Date(income.income_date);
                        
                        // Check if this income date is before the current next_generation_date
                        const currentNextDate = schedule.next_generation_date ? new Date(schedule.next_generation_date) : null;
                        
                        if (!currentNextDate || incomeDate < currentNextDate) {
                            // Set next_generation_date to the deleted income's date
                            // This allows regeneration
                            await database
                                .from('salary_schedules')
                                .update({
                                    next_generation_date: income.income_date,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', schedule.id);
                        }
                    }
                }
            }

            // Delete the income
            // The trigger will handle balance adjustments
            await Income.delete(req.params.id);
            res.json({ message: 'Ingreso eliminado exitosamente' });
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
                        // Calculate next generation date based on the schedule's salary_day
                        // NOT based on when it's confirmed - always generate on the salary_day
                        let nextGenerationDate;

                        if (schedule.frequency === 'monthly') {
                            // For monthly schedules, next generation is always on salary_day of next month
                            // This ensures consistency: if salary_day is 1, generate always on 1st of next month
                            const now = getNowGuatemala();
                            const currentYear = now.getFullYear();
                            const currentMonth = now.getMonth();
                            
                            // Calculate the next occurrence of salary_day
                            nextGenerationDate = new Date(currentYear, currentMonth + 1, schedule.salary_day);
                            
                            // If that date is in the past, move to the month after
                            if (nextGenerationDate < now) {
                                nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                            }
                        } else if (schedule.frequency === 'weekly') {
                            // For weekly schedules, next generation is 7 days from the confirmed date
                            const confirmedDate = parseGuatemalaDate(income.income_date);
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
            const now = getNowGuatemala();
            const currentDate = getTodayGuatemalaString();
            
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
                
            if (error) {
                console.error('Error fetching salary schedules:', error);
                throw error;
            }
            
            // Check if there are any schedules
            if (!salarySchedules || salarySchedules.length === 0) {
                return res.json({ 
                    message: 'No hay horarios de salario activos configurados',
                    generated: [] 
                });
            }
            
            const generatedIncomes = [];
            
            for (const schedule of salarySchedules) {
                // Calculate all payment dates from start_date to today that don't have incomes yet
                const startDate = parseGuatemalaDate(schedule.start_date);
                const paymentDates = [];
                
                if (schedule.frequency === 'monthly') {
                    // Generate monthly payment dates
                    let currentPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), schedule.salary_day);
                    
                    // If salary day is before start date in that month, move to next month
                    if (currentPaymentDate < startDate) {
                        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 1);
                    }
                    
                    // Generate all payment dates up to today (Guatemala timezone)
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
                    
                    // Create descriptive name with schedule name, month and year
                    // This ensures uniqueness when multiple schedules exist
                    const monthName = getMonthName(paymentDate.getMonth());
                    const year = paymentDate.getFullYear();
                    const incomeName = `${schedule.name} ${monthName} ${year}`;
                    
                    // Check if income already exists for this date and schedule
                    const { data: existingData, error: checkError } = await database
                        .from('income_sources')
                        .select('id')
                        .eq('user_id', userId)
                        .ilike('description', `%${schedule.name}%`)
                        .eq('income_date', paymentDateStr);
                    
                    if (checkError) {
                        console.error('Error checking existing income:', checkError);
                        continue; // Skip this date if there's an error
                    }
                    
                    // Only generate if no income exists for this exact period
                    if (!existingData || existingData.length === 0) {
                        try {
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
                                is_salary: true // Marcar como ingreso de salario (no es extra)
                            };
                            
                            const createdIncome = await Income.create(newIncome);
                            generatedIncomes.push(createdIncome);
                        } catch (createError) {
                            console.error('Error creating income for date', paymentDateStr, ':', createError);
                            // Continue with next date
                        }
                    }
                }
                
                // Update the salary schedule with new generation dates
                // The next_generation_date should be the LAST date we just generated + 1 period
                let nextGenerationDate;
                let lastGenerated = null;
                
                if (paymentDates.length > 0) {
                    // Get the last generated date
                    const lastPaymentDate = paymentDates[paymentDates.length - 1];
                    lastGenerated = lastPaymentDate.toISOString().split('T')[0];
                    
                    // Calculate next generation date based on the last one we generated
                    if (schedule.frequency === 'monthly') {
                        nextGenerationDate = new Date(lastPaymentDate);
                        nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                    } else if (schedule.frequency === 'weekly') {
                        nextGenerationDate = new Date(lastPaymentDate);
                        nextGenerationDate.setDate(nextGenerationDate.getDate() + 7);
                    }
                } else {
                    // No payment dates were generated, calculate next from start_date
                    if (schedule.frequency === 'monthly') {
                        const startDate = parseGuatemalaDate(schedule.start_date);
                        nextGenerationDate = new Date(startDate.getFullYear(), startDate.getMonth(), schedule.salary_day);
                        
                        // If salary day is before start date in that month, move to next month
                        if (nextGenerationDate < startDate) {
                            nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                        }
                        
                        // Make sure it's in the future
                        while (nextGenerationDate <= now) {
                            nextGenerationDate.setMonth(nextGenerationDate.getMonth() + 1);
                        }
                    } else if (schedule.frequency === 'weekly') {
                        const startDate = parseGuatemalaDate(schedule.start_date);
                        nextGenerationDate = new Date(startDate);
                        
                        // Calculate first occurrence after start_date
                        const startDayOfWeek = startDate.getDay();
                        const targetDayOfWeek = schedule.salary_day;
                        let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
                        if (daysToAdd === 0) daysToAdd = 7;
                        nextGenerationDate.setDate(startDate.getDate() + daysToAdd);
                        
                        // Make sure it's in the future
                        while (nextGenerationDate <= now) {
                            nextGenerationDate.setDate(nextGenerationDate.getDate() + 7);
                        }
                    }
                }
                
                // Update the schedule with new dates
                await database
                    .from('salary_schedules')
                    .update({
                        last_generated_date: lastGenerated || currentDate,
                        next_generation_date: nextGenerationDate ? nextGenerationDate.toISOString().split('T')[0] : null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', schedule.id);
            }
            
            const message = generatedIncomes.length > 0 
                ? `Se generaron ${generatedIncomes.length} ingresos de salario`
                : 'No hay nuevos salarios para generar';
                
            res.json({ 
                message,
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