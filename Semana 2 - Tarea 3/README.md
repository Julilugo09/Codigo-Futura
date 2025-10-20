# 🦈 Hello Tiburona Profesional
**Clase 4 – Código Futura (Soroban + Rust)**

Este contrato inteligente implementa un ejemplo profesional de **Hello World** en la red **Stellar Soroban**, con manejo de errores, almacenamiento persistente, control de acceso y tests automatizados.  
Además, incluye los **retos opcionales**: estadísticas por usuario, transferencia de administración y límites configurables.

## 🚀 Objetivos

Al completar este proyecto, se implementa un contrato que:
- Maneja errores de forma profesional (`Result`, `Error`)
- Organiza el estado con `DataKey`
- Controla acceso mediante direcciones (`Address`)
- Extiende TTL para datos importantes
- Incluye **tests completos**
- Implementa **retos adicionales avanzados**

## 🧩 Estructura del proyecto

```
contracts/
└── hello-world/
    ├── Cargo.toml
    ├── src/
    │   ├── lib.rs       ← Lógica del contrato
    │   └── test.rs      ← Tests unitarios
    └── README.md         ← (este archivo)
```

## ⚙️ Requisitos previos

Antes de ejecutar este contrato asegúrate de tener instalado:

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli
```

## 🧱 Implementación principal

### Errores personalizados
```rust
#[contracterror]
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}
```

### Claves de almacenamiento (`DataKey`)
```rust
#[contracttype]
pub enum DataKey {
    Admin,
    ContadorSaludos,
    UltimoSaludo(Address),
    ContadorPorUsuario(Address),
    LimiteCaracteres,
}
```

### Funciones principales
| Función | Descripción |
|----------|--------------|
| `initialize(env, admin)` | Inicializa el contrato, guardando el admin y el contador global. |
| `hello(env, usuario, nombre)` | Valida el nombre, incrementa contador global y del usuario, guarda último saludo. |
| `get_contador(env)` | Retorna el número total de saludos. |
| `get_ultimo_saludo(env, usuario)` | Retorna el último nombre saludado por el usuario. |
| `reset_contador(env, caller)` | Permite al admin resetear el contador global. |
| `get_contador_usuario(env, usuario)` | Retorna los saludos del usuario específico. |
| `transfer_admin(env, caller, nuevo_admin)` | Transfiere el control a otro administrador. |
| `set_limite(env, caller, limite)` | Define el límite máximo de caracteres permitido en `hello()`. |

## 🧪 Tests

El archivo `src/test.rs` incluye pruebas para:

| Test | Descripción |
|------|--------------|
| `test_initialize` | Verifica la inicialización correcta del contrato. |
| `test_no_reinicializar` | Evita inicializaciones múltiples. |
| `test_hello_exitoso` | Prueba saludo válido. |
| `test_nombre_vacio` | Detecta error por nombre vacío. |
| `test_reset_solo_admin` | Admin puede resetear contador. |
| `test_reset_no_autorizado` | Usuario no admin no puede resetear. |
| `test_contador_usuario` | Verifica contador por usuario. |
| `test_transfer_admin_y_reset` | Nuevo admin puede resetear. |
| `test_set_limite_y_validacion` | Cambia límite y valida error. |

## 🧰 Comandos útiles

### Compilar contrato:
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Ejecutar tests:
```bash
cargo test
```

### Optimizar el WASM:
```bash
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/hello_world.wasm
```

## 🧠 Conceptos aprendidos

- Uso de `Result<T, Error>` y `Option<T>` para manejar fallos controlados  
- Diferencia entre `instance()` (estado general) y `persistent()` (datos del usuario)  
- Cómo extender el TTL de datos en Soroban  
- Cómo diseñar **contratos seguros y configurables**

## 🧗 Retos adicionales completados

| Reto | Descripción | Estado |
|------|--------------|--------|
| 1️⃣ Contador por usuario | Rastrea cuántas veces saludó cada Tiburona | ✅ |
| 2️⃣ Transferencia de admin | Permite cambiar el administrador del contrato | ✅ |
| 3️⃣ Límite configurable | El admin puede definir cuántos caracteres se permiten en los nombres | ✅ |

## 🎓 Reflexión final

> “No solo escribí un `Hello World`.  
> Escribí un contrato con control de acceso, manejo de errores, y buenas prácticas de producción.  
> Ahora entiendo cómo construir contratos reales sobre **Soroban**.”

