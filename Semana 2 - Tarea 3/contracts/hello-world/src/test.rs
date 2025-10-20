#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        
        // Primera inicialización debe funcionar
        client.initialize(&admin);
        
        // Verificar contador en 0
        assert_eq!(client.get_contador(), 0);
    }
}

#[test]    
#[should_panic(expected = "NoInicializado")]
fn test_no_reinicializar() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);
        
    let admin = Address::generate(&env);
        
    client.initialize(&admin);
    client.initialize(&admin);  // Segunda vez debe fallar
}

#[test]
fn test_hello_exitoso() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);
        
    let admin = Address::generate(&env);
    let usuario = Address::generate(&env);
        
    client.initialize(&admin);
        
    // ⭐ Usar String::from_str en lugar de Symbol::new
    let nombre = String::from_str(&env, "Ana");
    let resultado = client.hello(&usuario, &nombre);
        
    assert_eq!(resultado, Symbol::new(&env, "Hola"));
    assert_eq!(client.get_contador(), 1);
    assert_eq!(client.get_ultimo_saludo(&usuario), Some(nombre));
}

#[test]
#[should_panic(expected = "NombreVacio")]
fn test_nombre_vacio() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);
        
    let admin = Address::generate(&env);
    let usuario = Address::generate(&env);
        
    client.initialize(&admin);
        
    // ⭐ Usar String::from_str para string vacío
    let vacio = String::from_str(&env, "");
    client.hello(&usuario, &vacio);  // Debe fallar
}

#[test]
fn test_reset_solo_admin() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);
        
    let admin = Address::generate(&env);
    let otro = Address::generate(&env);
    let usuario = Address::generate(&env);
        
    client.initialize(&admin);
        
    // ⭐ Hacer saludos con String
    client.hello(&usuario, &String::from_str(&env, "Test"));
    assert_eq!(client.get_contador(), 1);
        
    // Admin puede resetear
    client.reset_contador(&admin);
    assert_eq!(client.get_contador(), 0);
}

#[test]
#[should_panic(expected = "NoAutorizado")]
fn test_reset_no_autorizado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);
        
    let admin = Address::generate(&env);
    let otro = Address::generate(&env);
        
    client.initialize(&admin);
        
    // Otro usuario intenta resetear
    client.reset_contador(&otro);  // Debe fallar
}

#[test]
fn test_contador_usuario() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    client.hello(&user, &String::from_str(&env, "Ana"));
    client.hello(&user, &String::from_str(&env, "Ana"));

    assert_eq!(client.get_contador_usuario(&user), 2);
}

#[test]
fn test_transfer_admin_y_reset() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let nuevo = Address::generate(&env);

    client.initialize(&admin);

    client.transfer_admin(&admin, &nuevo);

    client.reset_contador(&nuevo);
    assert_eq!(client.get_contador(), 0);
}

#[test]
fn test_set_limite_y_validacion() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);
    let client = HelloContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    // Límite muy pequeño para forzar error
    client.set_limite(&admin, &1u32);

    // Esto debería fallar por NombreMuyLargo
    let nombre = String::from_str(&env, "AA");
    let _ = client.hello(&user, &nombre); 
}