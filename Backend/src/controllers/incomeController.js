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
            await Income.delete(req.params.id);
            res.json({ message: 'Income deleted' });
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

            // Si es un salario fuente confirmado, generar entrada automática para el período actual
            if (!income.is_confirmed && income.description && (income.description.includes('[FIJO]') || income.description.includes('[PROMEDIO]'))) {
                const database = require('../config').database;
                const userId = req.user.userId;
                const now = new Date();
                const incomeDay = new Date(income.income_date).getDate();
                let periodDate = new Date(now.getFullYear(), now.getMonth(), incomeDay);

                // Si ya pasó el día del ingreso en el mes actual, usar el mes actual
                // Si no, usar el mes anterior (para ingresos que se pagan por mes anterior)
                if (now.getDate() >= incomeDay) {
                    periodDate = new Date(now.getFullYear(), now.getMonth(), incomeDay);
                } else {
                    periodDate = new Date(now.getFullYear(), now.getMonth() - 1, incomeDay);
                }

                // Verificar si ya existe una entrada generada para este período
                const existingGenerated = await database
                    .from('income_sources')
                    .select('*')
                    .eq('user_id', userId)
                    .ilike('description', `%Generado desde: ${income.name}%`)
                    .eq('income_date', periodDate.toISOString().split('T')[0]);

                if (existingGenerated.data && existingGenerated.data.length === 0) {
                    // Crear entrada generada confirmada
                    const generatedIncome = {
                        user_id: userId,
                        name: `Salario: ${income.name}`,
                        type: 'fixed',
                        amount: income.amount,
                        currency_id: income.currency_id,
                        frequency: 'one-time',
                        income_date: periodDate.toISOString().split('T')[0],
                        description: `Generado desde: ${income.name} - ${income.frequency}`,
                        account_id: income.account_id,
                        is_confirmed: true // La entrada generada se confirma automáticamente
                    };

                    await Income.create(generatedIncome);
                }
            }

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
            
            // Find all fixed salaries (those with [FIJO] prefix in description)
            const { data: allIncomes, error } = await database
                .from('income_sources')
                .select('*')
                .eq('user_id', userId);
                
            if (error) throw error;
            
            const fixedSalaries = allIncomes.filter(income => 
                income.description && income.description.includes('[FIJO]')
            );
            
            const generatedIncomes = [];
            
            for (const salary of fixedSalaries) {
                const now = new Date();
                const salaryDay = new Date(salary.income_date).getDate();
                let shouldGenerate = false;
                let periodDate;
                
                if (salary.frequency === 'monthly') {
                    // For monthly salaries, generate only if we're past the salary day in the current month
                    if (now.getDate() >= salaryDay) {
                        // Generate for current month
                        periodDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);
                        shouldGenerate = true;
                    }
                    // If we're before the salary day, don't generate anything (wait for next month)
                } else if (salary.frequency === 'weekly') {
                    // For weekly salaries, check if a week has passed since last generation
                    const salaryDate = new Date(salary.income_date);
                    const daysSinceSalary = Math.floor((now - salaryDate) / (1000 * 60 * 60 * 24));
                    
                    // Find the most recent generated income for this salary
                    const recentGenerated = allIncomes
                        .filter(income => income.description && income.description.includes(`Generado desde: ${salary.name}`))
                        .sort((a, b) => new Date(b.income_date) - new Date(a.income_date))[0];
                    
                    if (!recentGenerated) {
                        // No previous generation, generate if we're past the initial salary date
                        if (now >= salaryDate) {
                            periodDate = new Date(salaryDate);
                            shouldGenerate = true;
                        }
                    } else {
                        // Check if a week has passed since last generation
                        const daysSinceLastGen = Math.floor((now - new Date(recentGenerated.income_date)) / (1000 * 60 * 60 * 24));
                        if (daysSinceLastGen >= 7) {
                            periodDate = new Date(recentGenerated.income_date);
                            periodDate.setDate(periodDate.getDate() + 7);
                            shouldGenerate = true;
                        }
                    }
                }
                
                if (shouldGenerate && periodDate) {
                    // Check if income for this period already exists
                    const existingIncome = allIncomes.find(income => 
                        income.description && 
                        income.description.includes(`Generado desde: ${salary.name}`) &&
                        new Date(income.income_date).toDateString() === periodDate.toDateString()
                    );
                    
                    if (!existingIncome) {
                        // Generate new income entry
                        const newIncome = {
                            user_id: userId,
                            name: `Salario: ${salary.name}`,
                            type: 'fixed',
                            amount: salary.amount,
                            currency_id: salary.currency_id,
                            frequency: 'one-time', // Generated incomes are one-time
                            income_date: periodDate.toISOString().split('T')[0],
                            description: `Generado desde: ${salary.name} - ${salary.frequency}`,
                            account_id: salary.account_id,
                            is_confirmed: false // Generated incomes need confirmation
                        };
                        
                        const createdIncome = await Income.create(newIncome);
                        generatedIncomes.push(createdIncome);
                    }
                }
            }
            
            res.json({ 
                message: `Generated ${generatedIncomes.length} income entries`,
                generated: generatedIncomes 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = IncomeController;