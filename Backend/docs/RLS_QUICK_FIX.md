# 🔐 Solución Rápida del Error RLS (42501)

## El Problema
Cuando intentas hacer login, recibes este error:
```
Profile creation on login: {
  code: '42501',
  message: 'new row violates row-level security policy for table "profiles"'
}
```

## La Causa
Supabase tiene políticas de Row Level Security (RLS) que impiden que el backend inserte registros en la tabla `profiles`.

## ✅ Solución en 3 Pasos

### Paso 1: Abre Supabase SQL Editor
1. Ve a https://supabase.com
2. Login en tu proyecto AhorraAI
3. En el menú izquierdo, haz clic en **SQL Editor** (icono de código `</>`
4. Haz clic en **+ New query**

### Paso 2: Copia y Pega el Script SQL
- Abre el archivo: `Backend/database/supabase_rls_setup.sql`
- Copia TODO el contenido
- Pégalo en la ventana de SQL Editor de Supabase
- **CTRL + Enter** para ejecutar

### Paso 3: Reinicia el Backend
En tu terminal (en la carpeta Backend):
```bash
npm run dev
```

---

## 📝 ¿Qué hace el script?

El script configura políticas de Row Level Security para cada tabla:

| Política | Permite |
|----------|---------|
| Backend service role can perform all operations | El backend (con SERVICE_ROLE_KEY) puede hacer cualquier cosa |
| Users can manage their own X | Los usuarios autenticados solo pueden ver/editar sus propios datos |

### Tabla de Políticas Aplicadas

✅ profiles  
✅ financial_settings  
✅ income_sources  
✅ accounts  
✅ spending_limits  
✅ categories  
✅ expenses  
✅ savings_goals  
✅ savings_deposits  
✅ loans  
✅ monthly_summary  
✅ yearly_summary  
⚪ currencies (sin restricciones - datos públicos)

---

## 🧪 Verificación Después de la Instalación

### En el Backend
Después de ejecutar el script, reinicia el backend y verifica que ves:
```
✓ Supabase URL: Loaded
✓ Supabase Anon Key: Loaded
✓ Supabase Service Role Key: Loaded
✓ Supabase clients created successfully
✓ Supabase DB connection test successful
```

### En el Frontend
1. Abre http://localhost:5173
2. Intenta hacer **Registro** con:
   - Email: `test@example.com`
   - Password: `password123`
   - Full Name: `Test User`
3. Debe redirigirte a `/onboarding` sin errores

4. Luego intenta hacer **Login** con las mismas credenciales
5. Debe redirigirte a `/dashboard` sin errores

### En el Browser Console
No debe haber errores de `JSON.parse` ni de autenticación.

---

## ❌ Si Aún Tienes Errores

### Error: "Policy creation failed"
- Verifica que estés en la **SQL Editor** (no en otra parte de Supabase)
- Intenta ejecutar el script nuevamente
- Si persiste, contacta al soporte de Supabase

### Error: "Column 'X' does not exist"
- Verifica que tus tablas existan en Supabase
- Ejecuta primero `Backend/database/schema.sql` si no lo has hecho
- Luego ejecuta `Backend/database/supabase_rls_setup.sql`

### Aún recibo error 42501 después del script
- Reinicia el backend: `Ctrl+C` y luego `npm run dev`
- Limpia el browser: F12 → Application → localStorage → Elimina todo
- Intenta de nuevo

---

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Row Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security#policy-examples)
- [Auth Rules](https://supabase.com/docs/guides/auth/row-level-security#auth-functions)

---

## 🎯 Próximos Pasos

Después de resolver RLS:

1. ✅ El login debe funcionar correctamente
2. ✅ El registro debe crear perfiles sin errores
3. ⬜ [Implementar Onboarding Flow](../docs/PAGES.md#onboardingpage)
4. ⬜ [Crear páginas de gestión](../docs/PAGES.md)
5. ⬜ [Integrar servicios de API](../docs/API_INTEGRATION.md)
