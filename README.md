# 🪙 Código Futura — Stellar & Soroban Projects

Repositorio de prácticas del programa **Código Futura**, con proyectos semanales que consolidan los fundamentos de **blockchain, Stellar SDK y Soroban (Rust)**.

Cada carpeta contiene ejercicios guiados, retos opcionales y reflexiones para desarrollar pensamiento lógico y habilidades de programación sobre la red Stellar 🌟.

---

## 📅 Semana 1 — Tarea 2

# 💼 Stellar Wallet de Consola

Pequeña **wallet de consola** construida con `@stellar/stellar-sdk` sobre la **Testnet de Stellar**.
Permite crear cuentas, consultar balances y enviar pagos desde la terminal, aplicando los fundamentos del SDK de Stellar.

### 🧭 Descripción general

Esta tarea buscó **dominar la API de Stellar** desde JavaScript y entender cómo se gestionan las cuentas y transacciones reales, pero en un entorno seguro (testnet).
El objetivo fue crear una wallet educativa que interactúa directamente con Horizon y permite automatizar operaciones.

### 🚀 Funcionalidades principales

* 🆕 Crear y fondear cuentas usando **Friendbot**
* 💸 Enviar pagos con **memos únicos**
* 👀 Consultar balances y trustlines
* ⚙️ Calcular tarifas de red según número de operaciones
* 🧾 Consultar historial de transacciones

### ⚙️ Requisitos

* Node.js ≥ 18
* npm o yarn
* Conexión a Internet
* Endpoint de la red: `https://horizon-testnet.stellar.org`

### 🧩 Instalación y uso

```bash
git clone https://github.com/Julilugo09/Codigo-Futura.git
cd Codigo-Futura
npm install
node wallet.js
```

También puedes ejecutar scripts individuales:

* `crear-cuenta.js`
* `enviar-pago.js`
* `consultar-balance.js`

### 🔍 Flujo principal

1. **Creación de cuentas** → genera claves con `Keypair.random()` y fondea con Friendbot.
2. **Pagos** → envía XLM entre cuentas con `TransactionBuilder` y `await`.
3. **Balances** → consulta información de varias cuentas en serie.
4. **Menú interactivo** → simula una wallet real desde terminal.

### 🧠 Conceptos clave

* Estructura de una transacción Stellar (source, operations, fee, memo)
* Firmas locales y envío seguro al servidor Horizon
* Lógica de wallet sin interfaz gráfica
* Programación asíncrona (`async/await`)

> “No busques perfección, busca progreso. Cada línea de código te acerca más a construir tu futuro.” 🦈⚡

---

## 📅 Semana 2 — Tarea 3

# 🦈 Hello Tiburona Profesional — Smart Contract (Soroban + Rust)

Proyecto que traslada los fundamentos aprendidos en la semana anterior al mundo de los **smart contracts en Rust**, usando **Soroban**, el motor de contratos de la red Stellar.
Aquí se implementa un contrato robusto con manejo de errores, control de acceso, almacenamiento persistente y pruebas automatizadas.

### 🎯 Objetivos

* Dominar `soroban-sdk` en Rust
* Aplicar estructuras `Result` y `Error`
* Manejar estado persistente y permisos de administrador
* Crear y probar funciones inteligentes
* Implementar **retos avanzados configurables**

### 🧩 Estructura del proyecto

```
contracts/
└── hello-world/
    ├── Cargo.toml
    ├── src/
    │   ├── lib.rs       ← Lógica del contrato
    │   └── test.rs      ← Tests unitarios
    └── README.md
```

### 🧱 Funcionalidades principales

| Función                                    | Descripción                                             |
| ------------------------------------------ | ------------------------------------------------------- |
| `initialize(env, admin)`                   | Inicializa el contrato y define el administrador.       |
| `hello(env, usuario, nombre)`              | Registra saludos con validaciones y persistencia.       |
| `get_contador(env)`                        | Retorna número total de saludos.                        |
| `get_ultimo_saludo(env, usuario)`          | Devuelve último saludo de cada usuario.                 |
| `reset_contador(env, caller)`              | Reinicia el contador global solo si el caller es admin. |
| `get_contador_usuario(env, usuario)`       | Cuenta saludos individuales.                            |
| `transfer_admin(env, caller, nuevo_admin)` | Transfiere el control del contrato.                     |
| `set_limite(env, caller, limite)`          | Configura longitud máxima de nombres.                   |

### 💾 Retos opcionales implementados

| Reto                       | Descripción                                          | Estado |
| -------------------------- | ---------------------------------------------------- | ------ |
| 1️⃣ Contador por usuario   | Registra cuántas veces saludó cada Tiburona          | ✅      |
| 2️⃣ Transferencia de admin | Permite cambiar el administrador                     | ✅      |
| 3️⃣ Límite configurable    | El admin puede ajustar la longitud máxima de nombres | ✅      |

### 🧪 Tests unitarios

Incluyen escenarios de:

* Inicialización y reintentos no válidos
* Saludos exitosos
* Errores por nombre vacío o exceso de caracteres
* Reset de contador (autorizado/no autorizado)
* Transferencia de admin y configuración de límite

### ⚙️ Comandos útiles

```bash
cargo build --target wasm32-unknown-unknown --release
cargo test
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/hello_world.wasm
```

### 🧠 Conceptos clave

* Cómo usar `DataKey` y `Env::storage()` para persistir estado
* Manejo de `Option`, `Result` y `Error` en contratos
* Extensión de TTL y seguridad de datos
* Diseño modular y escalable de contratos

> “No solo escribí un Hello World. Escribí un contrato con control de acceso, manejo de errores, y buenas prácticas de producción.”

---

## 📘 Estructura general del repositorio

```
Codigo-Futura/
├── 1ra-semana-js-wallet/
│   ├── crear-cuenta.js
│   ├── enviar-pago.js
│   ├── consultar-balance.js
│   └── wallet.js
├── 2da-semana-rust-consolidado/
│   └── hello-tiburona/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs
│       │   └── test.rs
│       └── README.md
└── README.md  ← (este archivo)
```

---

## 🧭 Conclusión general

Ambas tareas reflejan la evolución progresiva de un desarrollador blockchain en **Stellar**:
de dominar las herramientas básicas con JavaScript y el SDK,
a diseñar contratos inteligentes en Rust con estructura profesional.

> 💬 “De crear wallets a crear contratos: cada semana una capa más profunda del ecosistema Stellar.”
