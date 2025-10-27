// src/test.rs
#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    Address, Env, String, symbol_short,
};

/// Test básico de inicialización del token
/// 
/// Verifica que:
/// - El contrato se inicializa correctamente con metadatos válidos
/// - Los metadatos se pueden leer después de la inicialización
/// - El supply inicial es 0
#[test]
fn test_initialize() {
    // Arrange: Setup del entorno de testing
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let name = String::from_str(&env, "Builder Token");
    let symbol = String::from_str(&env, "BDB");
    
    // Act: Inicializar el token
    let result = client.initialize(&admin, &name, &symbol, &7);
    assert!(result.is_ok());
    
    // Assert: Verificar que los metadatos se guardaron correctamente
    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.decimals(), 7);
    assert_eq!(client.total_supply(), 0);
}

/// Test de protección contra doble inicialización
/// 
/// Verifica que el contrato no puede ser inicializado dos veces,
/// lo cual es crítico para la seguridad del token.
#[test]
fn test_initialize_twice_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let name = String::from_str(&env, "Token");
    let symbol = String::from_str(&env, "TOK");
    
    // Primera inicialización debe funcionar
    assert!(client.initialize(&admin, &name, &symbol, &7).is_ok());
    
    // Segunda debe fallar con AlreadyInitialized
    let result = client.try_initialize(&admin, &name, &symbol, &7);
    assert_eq!(result, Err(Ok(TokenError::AlreadyInitialized)));
}

/// Test de validación de decimales
/// 
/// Los decimales deben estar en el rango 0-18.
/// 18 es el máximo para compatibilidad con Ethereum,
/// 7 es el estándar en Stellar (alineado con XLM).
#[test]
fn test_invalid_decimals() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    
    // Decimales > 18 debe fallar
    let result = client.try_initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &19  // ❌ Inválido: excede MAX_DECIMALS (18)
    );
    assert_eq!(result, Err(Ok(TokenError::InvalidDecimals)));
}

/// Test básico de mint y consulta de balance
/// 
/// Verifica el flujo completo:
/// 1. Initialize del token
/// 2. Mint de tokens a un usuario
/// 3. Consulta de balance
/// 4. Verificación de total supply
#[test]
fn test_mint_and_balance() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    
    // Initialize el token
    client.initialize(
        &admin, 
        &String::from_str(&env, "Builder Token"),
        &String::from_str(&env, "BDB"),
        &7
    ).unwrap();
    
    // Mock auth: En tests, simulamos autorizaciones sin firmas reales
    env.mock_all_auths();
    
    // Mintear 1000 tokens
    client.mint(&user, &1000).unwrap();
    
    // Verificar estado actualizado
    assert_eq!(client.balance(&user), 1000);
    assert_eq!(client.total_supply(), 1000);
}

/// Test: mint con amount = 0 debe fallar
/// 
/// Mintear 0 tokens no tiene sentido y podría
/// causar eventos innecesarios o confusión.
#[test]
fn test_mint_zero_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    
    // Mintear 0 debe fallar con InvalidAmount
    let result = client.try_mint(&user, &0);
    assert_eq!(result, Err(Ok(TokenError::InvalidAmount)));
}

/// Test básico de transferencia entre dos usuarios
/// 
/// Verifica el flujo completo de transfer:
/// 1. Alice tiene 1000 tokens
/// 2. Alice transfiere 250 tokens a Bob
/// 3. Ambos balances se actualizan correctamente
#[test]
fn test_transfer() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    
    // Setup: Initialize y dar tokens a Alice
    client.initialize(
        &admin,
        &String::from_str(&env, "Builder Token"),
        &String::from_str(&env, "BDB"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &1000).unwrap();
    
    // Act: Alice transfiere a Bob
    client.transfer(&alice, &bob, &250).unwrap();
    
    // Assert: Verificar ambos balances
    assert_eq!(client.balance(&alice), 750);  // 1000 - 250
    assert_eq!(client.balance(&bob), 250);
}

/// Test: transfer con balance insuficiente debe fallar
/// 
/// No puedes transferir más tokens de los que tienes.
/// Este es uno de los errores más comunes en tokens.
#[test]
fn test_transfer_insufficient_balance() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &100).unwrap();
    
    // Intentar transferir más de lo que tiene debe fallar
    let result = client.try_transfer(&alice, &bob, &200);
    assert_eq!(result, Err(Ok(TokenError::InsufficientBalance)));
}

/// Test: transfer a sí mismo debe fallar
/// 
/// Decisión de diseño: prohibimos transferencias a sí mismo por:
/// - Ahorro de gas (operación inútil)
/// - Evitar eventos confusos
/// - Prevenir errores del usuario
#[test]
fn test_transfer_to_self() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &1000).unwrap();
    
    // Transfer a sí mismo debe fallar con InvalidRecipient
    let result = client.try_transfer(&alice, &alice, &100);
    assert_eq!(result, Err(Ok(TokenError::InvalidRecipient)));
    assert_eq!(client.balance(&alice), 1000); // Balance no debe cambiar
}

/// Test del flujo completo de approve + transfer_from
/// 
/// Este es el patrón "allowance" usado en DeFi:
/// 1. Alice aprueba a Bob para gastar hasta 300 tokens
/// 2. Bob usa transfer_from para mover 200 tokens de Alice a Charlie
/// 3. El allowance se reduce automáticamente a 100
#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);
    
    // Setup
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &1000).unwrap();
    
    // Alice aprueba a Bob para gastar hasta 300 tokens
    client.approve(&alice, &bob, &300).unwrap();
    assert_eq!(client.allowance(&alice, &bob), 300);
    
    // Bob transfiere 200 tokens de Alice a Charlie
    client.transfer_from(&bob, &alice, &charlie, &200).unwrap();
    
    // Verificar estado final
    assert_eq!(client.balance(&alice), 800);          // 1000 - 200
    assert_eq!(client.balance(&charlie), 200);        // 0 + 200
    assert_eq!(client.allowance(&alice, &bob), 100);  // 300 - 200
}

/// Test: transfer_from con allowance insuficiente debe fallar
/// 
/// Bob solo puede gastar hasta el límite aprobado por Alice.
#[test]
fn test_transfer_from_insufficient_allowance() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);
    
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &1000).unwrap();
    client.approve(&alice, &bob, &100).unwrap();  // Solo 100 aprobados
    
    // Bob intenta transferir más de lo aprobado
    let result = client.try_transfer_from(&bob, &alice, &charlie, &200);
    assert_eq!(result, Err(Ok(TokenError::InsufficientAllowance)));
}

/// Test básico de burn (quemar tokens)
/// 
/// Burn reduce tanto el balance del usuario como el supply total.
/// Es usado para reducir supply (deflación), fees, etc.
#[test]
fn test_burn() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    
    client.initialize(
        &admin,
        &String::from_str(&env, "Token"),
        &String::from_str(&env, "TOK"),
        &7
    ).unwrap();
    
    env.mock_all_auths();
    client.mint(&alice, &1000).unwrap();
    
    // Alice quema 300 de sus tokens
    client.burn(&alice, &300).unwrap();
    
    // Verificar que tanto balance como supply se redujeron
    assert_eq!(client.balance(&alice), 700);    // 1000 - 300
    assert_eq!(client.total_supply(), 700);     // 1000 - 300
}

/// Test: todas las operaciones deben fallar si no se inicializó
/// 
/// Verifica que el flag de inicialización se verifica en
/// TODAS las funciones que modifican estado.
#[test]
fn test_operations_without_init() {
    let env = Env::default();
    let contract_id = env.register_contract(None, TokenBDB);
    let client = TokenBDBClient::new(&env, &contract_id);
    
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Todas las operaciones deben fallar con NotInitialized
    assert_eq!(
        client.try_mint(&alice, &100),
        Err(Ok(TokenError::NotInitialized))
    );
    
    assert_eq!(
        client.try_transfer(&alice, &bob, &50),
        Err(Ok(TokenError::NotInitialized))
    );
    
    assert_eq!(
        client.try_burn(&alice, &10),
        Err(Ok(TokenError::NotInitialized))
    );
}

