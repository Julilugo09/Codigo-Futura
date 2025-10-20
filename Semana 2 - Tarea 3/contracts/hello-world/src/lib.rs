#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    Env, Symbol, Address, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ContadorSaludos,
    UltimoSaludo(Address),
    // --- Retos ---
    ContadorPorUsuario(Address),
    LimiteCaracteres,
}

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NoInicializado);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ContadorSaludos, &0u32);

        // Límite de longitud por defecto (Reto 3)
        env.storage()
            .instance()
            .set(&DataKey::LimiteCaracteres, &32u32);

        env.storage().instance().extend_ttl(100, 100);
        Ok(())
    }

    pub fn hello(
        env: Env, 
        usuario: Address, 
        nombre: String
    ) -> Result<Symbol, Error> {
        if nombre.len() == 0 {
            return Err(Error::NombreVacio);
        }

        // Límite configurable (Reto 3)
        let limite: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LimiteCaracteres)
            .unwrap_or(32);

        if (nombre.len() as u32) > limite {
            return Err(Error::NombreMuyLargo);
        }

        // Contador global
        let key_contador = DataKey::ContadorSaludos;
        let contador: u32 = env.storage()
            .instance()
            .get(&key_contador)
            .unwrap_or(0);

        env.storage()
            .instance()
            .set(&key_contador, &(contador + 1));

        // Último saludo
        env.storage()
            .persistent()
            .set(&DataKey::UltimoSaludo(usuario.clone()), &nombre);

        // Reto 1: contador por usuario
        let key_user = DataKey::ContadorPorUsuario(usuario.clone());
        let cont_user: u32 = env.storage()
            .persistent()
            .get(&key_user)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key_user, &(cont_user + 1));

        // TTLs
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::UltimoSaludo(usuario.clone()), 100, 100);
        env.storage()
            .persistent()
            .extend_ttl(&key_user, 100, 100);
        env.storage()
            .instance()
            .extend_ttl(100, 100);

        Ok(Symbol::new(&env, "Hola"))
    }

    pub fn get_contador(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ContadorSaludos)
            .unwrap_or(0)
    }

    pub fn get_ultimo_saludo(env: Env, usuario: Address) -> Option<String> {
        env.storage()
            .persistent()
            .get(&DataKey::UltimoSaludo(usuario))
    }

    // --- Reto 1 ---
    pub fn get_contador_usuario(env: Env, usuario: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::ContadorPorUsuario(usuario))
            .unwrap_or(0)
    }

    pub fn reset_contador(env: Env, caller: Address) -> Result<(), Error> {
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }

        env.storage()
            .instance()
            .set(&DataKey::ContadorSaludos, &0u32);
        Ok(())
    }

    // --- Reto 2 ---
    pub fn transfer_admin(
        env: Env,
        caller: Address,
        nuevo_admin: Address
    ) -> Result<(), Error> {
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }

        env.storage().instance().set(&DataKey::Admin, &nuevo_admin);
        env.storage().instance().extend_ttl(100, 100);
        Ok(())
    }

    // --- Reto 3 ---
    pub fn set_limite(
        env: Env,
        caller: Address,
        limite: u32
    ) -> Result<(), Error> {
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }

        env.storage()
            .instance()
            .set(&DataKey::LimiteCaracteres, &limite);
        env.storage().instance().extend_ttl(100, 100);
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;
    use soroban_sdk::testutils::Address as _;

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

    #[test]    
    #[should_panic(expected = "Error(Contract, #4)")]
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
    #[should_panic(expected = "Error(Contract, #1)")]
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
    #[should_panic(expected = "Error(Contract, #3)")]
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
    #[should_panic(expected = "Error(Contract, #2)")]
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
}