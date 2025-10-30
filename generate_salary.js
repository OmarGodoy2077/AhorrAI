const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Simular la lógica de generateSalaryIncomes para el usuario
async function generateSalary() {
  const userId = 'b3b4ab2f-d94c-46e0-b76f-bbd8f654cde1';

  const { data: allIncomes, error } = await supabase
    .from('income_sources')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const fixedSalaries = allIncomes.filter(income =>
    income.description && income.description.includes('[FIJO]') && income.is_confirmed
  );

  console.log('Fixed salaries found:', fixedSalaries.length);

  for (const salary of fixedSalaries) {
    const now = new Date();
    const salaryDay = new Date(salary.income_date).getDate();

    // Para salarios mensuales, generar si estamos en el período correcto
    if (now.getDate() >= salaryDay) {
      const periodDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);

      const existingIncome = allIncomes.find(income =>
        income.description &&
        income.description.includes(`Generado desde: ${salary.name}`) &&
        new Date(income.income_date).toDateString() === periodDate.toDateString()
      );

      if (!existingIncome) {
        const newIncome = {
          user_id: userId,
          name: `Salario: ${salary.name}`,
          type: 'fixed',
          amount: salary.amount,
          currency_id: salary.currency_id,
          frequency: 'one-time',
          income_date: periodDate.toISOString().split('T')[0],
          description: `Generado desde: ${salary.name} - ${salary.frequency}`,
          account_id: salary.account_id,
          is_confirmed: true
        };

        const { data, error: insertError } = await supabase
          .from('income_sources')
          .insert([newIncome])
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log('Generated income:', data[0]);
        }
      } else {
        console.log('Income already exists for this period');
      }
    }
  }
}

generateSalary().then(() => process.exit(0));