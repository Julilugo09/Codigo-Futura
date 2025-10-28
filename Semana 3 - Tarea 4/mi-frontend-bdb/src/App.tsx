// ========================================
// IMPORTS - Librerías que necesitamos
// ========================================

// React hooks para manejar estado
import { useState } from 'react';

// Freighter API para conectar la wallet
import { isConnected } from '@stellar/freighter-api';
import freighterApi from '@stellar/freighter-api'; 

// Cliente del contrato BDB generado automáticamente
import { Client as BuenDiaTokenClient } from './generated/buen_dia_token/src';

import Server from '@stellar/stellar-sdk'; 

// ========================================
// COMPONENTE AUXILIAR: Estrellas Animadas (Ajustado para tema claro/oscuro)
// ========================================

const AnimatedStars = ({ isDark }: { isDark: boolean }) => {
  const stars = Array.from({ length: 30 }, (_, i) => ({ 
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 6}s`, 
    size: Math.random() * 2 + 0.5 
  }));

  const starColor = isDark ? 'rgba(220, 200, 255, 0.6)' : 'rgba(150, 120, 200, 0.4)';

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, overflow: 'hidden'
      }}
    >
      {stars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute', left: star.left, top: star.top,
            width: `${star.size}px`, height: `${star.size}px`,
            
            backgroundColor: starColor, 
            borderRadius: '50%',
            animation: `twinkle 6s ease-in-out infinite`, 
            animationDelay: star.animationDelay
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.7); }
          50% { opacity: 0.6; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};


function App() {


  const [publicKey, setPublicKey] = useState<string>(''); // Dirección pública del usuario
  const [connected, setConnected] = useState<boolean>(false); // ¿Wallet conectada?
  const [balance, setBalance] = useState<string>('0'); // Balance del token BDB (formateado)
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false); // ¿Cargando balance?
  const [showBalance, setShowBalance] = useState<boolean>(false); // Controla si se muestra el balance

  const [totalSupply, setTotalSupply] = useState<string>('0'); // Suministro total del token BDB (formateado)
  const [loadingTotalSupply, setLoadingTotalSupply] = useState<boolean>(false); // ¿Cargando suministro total?

  
  const [recipient, setRecipient] = useState<string>(''); // Dirección destino
  const [amount, setAmount] = useState<string>(''); // Cantidad a transferir (como string)
  const [transferring, setTransferring] = useState<boolean>(false); // ¿Transfiriendo?
  const [message, setMessage] = useState<string>(''); // Mensajes de feedback
  const [transactions, setTransactions] = useState<Array<{ // Historial simple
    type: 'sent' | 'received', address: string, amount: string, timestamp: Date
  }>>([]);

  
  const [isDark, setIsDark] = useState<boolean>(false); // Inicia en modo claro

  
  const TOKEN_DECIMALS = 7;
  const STROOPS_PER_TOKEN = 10 ** TOKEN_DECIMALS;

  // ========================================
  // TEMA DE COLORES (Claro: Fondo Blanco, Lila | Oscuro: Fondo Oscuro, Lila)
  // ========================================
   const theme = isDark
    ? { // Tema Oscuro
        background: 'linear-gradient(145deg, #2a1f44, #1a142b)', // Lila muy oscuro
        cardBg: 'rgba(59, 42, 84, 0.6)', // Lila oscuro semi-transparente + blur
        cardText: '#ede7f6', // Lila muy pálido
        secondaryText: '#cebce4', // Lila medio
        primaryButton: 'linear-gradient(90deg, #ab47bc, #ce93d8)', // Lila vibrante a claro
        primaryHover: 'linear-gradient(90deg, #9b37a9, #ba7fc1)',
        secondaryButton: 'linear-gradient(90deg, #7e57c2, #9575cd)', // Lila más azulado
        secondaryHover: 'linear-gradient(90deg, #6d4aaf, #8367c0)',
        inputBg: 'rgba(70, 55, 100, 0.8)',
        successBg: 'rgba(129, 199, 132, 0.2)', // Verde suave transparente
        errorBg: 'rgba(229, 115, 115, 0.2)', // Rojo suave transparente
        border: 'rgba(197, 179, 231, 0.3)' // Borde lila transparente
      }
    : { // Tema Claro
        background: '#ffffff', // Fondo blanco sólido
        cardBg: 'rgba(243, 229, 245, 0.6)', // Lila muy pálido semi-transparente + blur
        cardText: '#4a148c', // Lila oscuro intenso para texto
        secondaryText: '#8e24aa', // Lila medio
        primaryButton: 'linear-gradient(90deg, #ab47bc, #ce93d8)', // Lila vibrante a claro
        primaryHover: 'linear-gradient(90deg, #9b37a9, #ba7fc1)',
        secondaryButton: 'linear-gradient(90deg, #7e57c2, #9575cd)', // Lila más azulado
        secondaryHover: 'linear-gradient(90deg, #6d4aaf, #8367c0)',
        inputBg: 'rgba(255, 255, 255, 0.8)', // Blanco más opaco
        successBg: 'rgba(200, 230, 201, 0.6)', // Verde pálido
        errorBg: 'rgba(255, 205, 210, 0.6)', // Rosa pálido
        border: 'rgba(171, 71, 188, 0.2)' // Borde lila suave
      };


  // ========================================
  // FUNCIÓN: Limpiar Mensaje Temporalmente
  // ========================================
  const showTemporaryMessage = (msg: string, duration: number = 3500) => { 
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };


  // ========================================
  // FUNCIÓN: Conectar Wallet Freighter
  // ========================================

  const connectWallet = async () => {
    try {
      if (await isConnected()) {
        console.log("Freighter is connected. Requesting access...");
        await freighterApi.requestAccess();
        console.log("Access requested. Attempting to get address...");
        const walletData = await freighterApi.getAddress();
        const pk = walletData?.address;
        if (!pk) {
          throw new Error("No se pudo obtener la clave pública de Freighter.");
        }
        setPublicKey(pk);
        setConnected(true);
        console.log('Wallet conectada:', pk);
        showTemporaryMessage('✅ ¡Wallet conectada con éxito!');
        getTotalSupply(); 
      } else {
        alert('Por favor instalá Freighter wallet desde https://freighter.app');
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      showTemporaryMessage('❌ Error al conectar. Revisa la consola y Freighter.');
    }
  };

  // ========================================
  // FUNCIÓN: Obtener Balance del Token BDB
  // ========================================

  const getBalance = async () => {
     if (!connected || !publicKey) {
      showTemporaryMessage('⚠️ Conectá tu wallet primero');
      return;
    }
    setLoadingBalance(true);
    setShowBalance(true);
    setBalance('...');

    try {
      const contractId = import.meta.env.VITE_BDB_CONTRACT_ID;
      if (!contractId) throw new Error("VITE_BDB_CONTRACT_ID no definido en .env");

      const client = new BuenDiaTokenClient({
          contractId,
          networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK === 'testnet'
              ? 'Test SDF Network ; September 2015'
              : 'Public Global Stellar Network ; September 2015',
          rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL,
          publicKey,
      });

      console.log(`Llamando balance en contrato ${contractId} para cuenta: ${publicKey}`);
      const resultObject = await client.balance({ account: publicKey });
      console.log('Objeto completo devuelto por client.balance:', resultObject);

      let balanceValue: bigint | undefined = undefined;

      if (resultObject && typeof resultObject.result === 'bigint') {
         balanceValue = resultObject.result;
         console.log('Valor extraído de resultObject.result:', balanceValue);
      } else if (resultObject?.simulation && 'result' in resultObject.simulation && typeof resultObject.simulation.result?.retval?.value === 'function') {
        try {
            const simValue = resultObject.simulation.result.retval.value();
            if (typeof simValue === 'bigint') balanceValue = simValue;
            else console.warn("retval.value() no devolvió bigint:", simValue);
        } catch (e) { console.error("Error al llamar a retval.value(): ", e); }
      }

      if (balanceValue === undefined) {
         if (resultObject?.simulation && 'error' in resultObject.simulation) throw new Error(`Error en simulación: ${resultObject.simulation.error}`);
         else {
           console.warn("No se pudo extraer el valor del balance, asumiendo 0.", resultObject);
           balanceValue = 0n;
         }
      }

      const balanceAsString = (Number(balanceValue) / STROOPS_PER_TOKEN).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: TOKEN_DECIMALS });
      setBalance(balanceAsString);
      console.log('Balance guardado (formateado):', balanceAsString);

    } catch (error) {
      console.error('Error obteniendo balance:', error);
      setBalance('Error');
      showTemporaryMessage(`❌ Error al obtener balance: ${error instanceof Error ? error.message : 'Error desconocido'}.`);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ========================================
  // FUNCIÓN: Obtener Suministro Total (Total Supply)
  // ========================================
  const getTotalSupply = async () => {
    setLoadingTotalSupply(true);
    setTotalSupply('...');

    try {
        const contractId = import.meta.env.VITE_BDB_CONTRACT_ID;
        if (!contractId) throw new Error("VITE_BDB_CONTRACT_ID no definido en .env");

        const client = new BuenDiaTokenClient({
            contractId,
            networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK === 'testnet'
                ? 'Test SDF Network ; September 2015'
                : 'Public Global Stellar Network ; September 2015',
            rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL,
        });

        console.log(`Llamando total_supply en contrato ${contractId}`);
        const resultObject = await client.total_supply();
        console.log('Objeto completo devuelto por client.total_supply:', resultObject);

        let supplyValue: bigint | undefined = undefined;

        if (resultObject && typeof resultObject.result === 'bigint') {
            supplyValue = resultObject.result;
            console.log('Valor extraído de resultObject.result (supply):', supplyValue);
        } else if (resultObject?.simulation && 'result' in resultObject.simulation && typeof resultObject.simulation.result?.retval?.value === 'function') {
           try {
              const simValue = resultObject.simulation.result.retval.value();
              if (typeof simValue === 'bigint') supplyValue = simValue;
              else console.warn("retval.value() no devolvió bigint (supply):", simValue);
            } catch(e) { console.error("Error al llamar a retval.value() (supply): ", e); }
        }

        if (supplyValue === undefined) {
             if (resultObject?.simulation && 'error' in resultObject.simulation) throw new Error(`Error en simulación (supply): ${resultObject.simulation.error}`);
             else {
                console.warn("No se pudo extraer el valor del suministro total, asumiendo 0.", resultObject);
                supplyValue = 0n;
             }
        }

        const supplyAsString = (Number(supplyValue) / STROOPS_PER_TOKEN).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS });
        setTotalSupply(supplyAsString);
        console.log('Total Supply guardado (formateado):', supplyAsString);

    } catch (error) {
        console.error('Error obteniendo Total Supply:', error);
        setTotalSupply('Error');
        showTemporaryMessage(`❌ Error al obtener Total Supply: ${error instanceof Error ? error.message : 'Error desconocido'}.`);
    } finally {
        setLoadingTotalSupply(false);
    }
};

 // ========================================
  // FUNCIÓN: Transferir Tokens BDB
  // ========================================
  const handleTransfer = async () => {
    if (!connected || !publicKey) return showTemporaryMessage('⚠️ Conectá tu wallet primero');
    if (!recipient || !amount) return showTemporaryMessage('⚠️ Completá dirección y cantidad');
    if (!recipient.startsWith('G') || recipient.length !== 56) return showTemporaryMessage('⚠️ Dirección inválida');
    if (!freighterApi.signTransaction) return showTemporaryMessage('⚠️ Función signTransaction no disponible');

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || isNaN(amountNum)) return showTemporaryMessage('⚠️ Cantidad debe ser mayor a 0');

    setTransferring(true);
    showTemporaryMessage('⏳ Procesando transferencia...');

    try {
      const contractId = import.meta.env.VITE_BDB_CONTRACT_ID;
      if (!contractId) throw new Error("VITE_BDB_CONTRACT_ID no definido en .env");

      const client = new BuenDiaTokenClient({
        contractId,
        networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK === 'testnet'
            ? 'Test SDF Network ; September 2015'
            : 'Public Global Stellar Network ; September 2015',
        rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL,
        publicKey,
      });

      const amountInStroops = BigInt(Math.floor(amountNum * STROOPS_PER_TOKEN));

      console.log('🧾 Preparando transferencia:', { from: publicKey, to: recipient, amountBDB: amountNum, amountStroops: amountInStroops.toString() });

      const tx = await client.transfer({
        from: publicKey,
        to: recipient,
        amount: amountInStroops
      });

      console.log("Transacción construida (antes de firmar):", tx);

      const signedTx = await freighterApi.signTransaction(tx.toXDR());

      console.log("Transacción firmada:", signedTx);

      const server = new Server(import.meta.env.VITE_STELLAR_RPC_URL!, { allowHttp: import.meta.env.VITE_STELLAR_RPC_URL?.startsWith("http://")});
      const sendResponse = await server.sendTransaction(signedTx);
      console.log('Respuesta de sendTransaction:', sendResponse);

      if (sendResponse.status === 'PENDING' || sendResponse.status === 'SUCCESS' || sendResponse.status === 'ALREADY_SUBMITTED' ) {
          console.log('✅ Transacción enviada o ya procesada!');
          const newTransaction = { type: 'sent' as const, address: recipient, amount: amountNum.toFixed(TOKEN_DECIMALS), timestamp: new Date() };
          setTransactions([newTransaction, ...transactions].slice(0, 5));
          showTemporaryMessage(`✅ Transferencia exitosa! Enviaste ${amountNum} BDB`);
          setRecipient('');
          setAmount('');
          setTimeout(() => getBalance(), 3000);
      } else {
         let errorDetails = '';
         if (sendResponse.errorResult) {
            try {
                 if (typeof sendResponse.errorResult.result === 'function') {
                    errorDetails = ` (${sendResponse.errorResult.result().value()?.toString() ?? 'Detalles no disponibles'})`;
                 } else {
                    errorDetails = ` (${JSON.stringify(sendResponse.errorResult)})`;
                 }
            } catch (e) { errorDetails = ' (No se pudo decodificar el error)'; }
         } else if (sendResponse.diagnosticEvents && sendResponse.diagnosticEvents.length > 0) {
            errorDetails = ` (Eventos: ${JSON.stringify(sendResponse.diagnosticEvents)})`;
         }
         throw new Error(`La transacción falló con status: ${sendResponse.status}${errorDetails}`);
      }

    } catch (error: any) {
      console.error('Error en transferencia:', error);
      let errMsg = 'Error desconocido. Intenta de nuevo.';
      if (error?.message) {
          errMsg = error.message;
      } else if (typeof error === 'string') {
          errMsg = error;
      }
      showTemporaryMessage(`❌ Error: ${errMsg}`);
    } finally {
      setTransferring(false);
    }
  };


  // ========================================
  // INTERFAZ (JSX - Lo que se ve en pantalla)
  // ========================================
  return (
     // Contenedor principal con centrado y fuente
     <div style={{
          minHeight: '100vh', background: theme.background, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          fontFamily: "'Nunito', sans-serif", 
          position: 'relative', overflow: 'hidden', transition: 'background 0.5s ease'
      }}>
        
          <AnimatedStars isDark={isDark} />

          {}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{ 
                position: 'fixed', top: '20px', right: '20px', padding: '10px 20px',
                background: theme.secondaryButton, color: theme.cardText, border: 'none',
                borderRadius: '25px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                zIndex: 10, transition: 'all 0.3s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.9)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            {isDark ? '☀️ Claro' : '🌙 Oscuro'}
          </button>

          {}
          <div style={{ /* Estilos tarjeta */
              background: theme.cardBg, borderRadius: '25px', padding: '35px',
              maxWidth: '500px', width: '100%', boxShadow: '0 15px 50px rgba(0,0,0,0.25)',
              position: 'relative', zIndex: 1, border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', color: theme.cardText 
            }} >
              {/* Título */}
              <h1 style={{
                  color: theme.secondaryText, 
                  marginBottom: '10px', fontSize: '28px', textAlign: 'center', fontWeight: '700'
                }} >
                🔮 Tiburona Token 🔮
              </h1>
              <p style={{
                  textAlign: 'center', color: theme.secondaryText, fontSize: '14px', marginBottom: '30px'
                }} >
                ¡Hola Tiburona Builder! Gestiona tus tokens.
              </p>

              {/* Mensajes de feedback */}
               {message && (
                    <div style={{
                        marginBottom: '20px', padding: '12px 15px',
                        background: message.includes('✅') ? theme.successBg : (message.includes('⚠️') ? 'rgba(255, 238, 88, 0.3)' : theme.errorBg), // Amarillo más suave para warning
                        borderRadius: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px',
                        color: theme.cardText, border: `1px solid ${theme.border}`
                    }}>
                        {message}
                    </div>
               )}

              {/* Contenido Condicional: Conectado vs No Conectado */}
              {!connected ? (
                  <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', color: theme.cardText, marginBottom: '25px' }}>
                          Conecta tu wallet Freighter para empezar la magia ✨
                      </p>
                      <button
                          onClick={connectWallet}
                          style={{ /* Estilos botón conectar */
                              padding: '12px 30px', fontSize: '16px', fontWeight: 'bold',
                              background: theme.primaryButton, color: '#fff', border: 'none',
                              borderRadius: '25px', cursor: 'pointer', transition: 'all 0.3s ease',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                          }}
                           onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} 
                           onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                      >
                          🔗 Conectar Wallet
                      </button>
                  </div>
              ) : (
                  <div>
                      {/* Info de la cuenta */}
                      <div style={{ /* Estilos info cuenta */
                          padding: '12px 15px', background: 'rgba(0,0,0,0.04)', borderRadius: '12px',
                          marginBottom: '25px', border: `1px solid ${theme.border}`, textAlign: 'left'
                      }}>
                          <p style={{ fontWeight: '600', marginBottom: '5px', fontSize: '13px', color: theme.secondaryText }}>
                              Conectado como:
                          </p>
                          <code style={{ 
                              background: 'transparent', padding: '0', borderRadius: '0',
                              display: 'block', fontSize: '12px', color: theme.cardText,
                              wordBreak: 'break-all'
                          }}>
                              {publicKey}
                          </code>
                      </div>

                      {/* Sección Balance */}
                      <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <button
                              onClick={getBalance}
                              disabled={loadingBalance}
                              style={{ /* Estilos botón balance */
                                  padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                                  background: loadingBalance ? '#ccc' : theme.secondaryButton,
                                  color: '#fff', border: 'none', borderRadius: '12px', 
                                  cursor: loadingBalance ? 'not-allowed' : 'pointer', flexShrink: 0,
                                  transition: 'all 0.3s ease', boxShadow: loadingBalance ? 'none' : '0 3px 10px rgba(0,0,0,0.15)'
                              }}
                              onMouseEnter={e => !loadingBalance ? e.currentTarget.style.filter = 'brightness(1.1)' : null}
                              onMouseLeave={e => !loadingBalance ? e.currentTarget.style.filter = 'brightness(1)' : null}
                           >
                              {loadingBalance ? '⏳...' : 'Ver Balance'}
                          </button>

                           {/* Display del Balance */}
                           {showBalance && (
                              <div style={{ 
                                  flexGrow: 1, padding: '8px 12px', backgroundColor: theme.successBg,
                                  borderRadius: '12px', border: `1px solid ${theme.border}`, textAlign: 'right'
                              }}>
                                  <span style={{ fontSize: '12px', color: theme.secondaryText }}>Balance: </span>
                                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: theme.cardText }}>
                                      {balance} BDB
                                  </span>
                              </div>
                           )}
                      </div>

                       {/* Sección Total Supply */}
                      <div style={{ /* Estilos Total Supply */
                          padding: '12px 15px', backgroundColor: theme.inputBg, borderRadius: '12px',
                          textAlign: 'center', border: `1px solid ${theme.border}`, marginBottom: '25px'
                      }}>
                          <p style={{ fontSize: '13px', margin: '0 0 5px 0', color: theme.secondaryText }}>
                              Suministro Total:
                          </p>
                          <p style={{ /* Estilos valor supply */
                              fontSize: '18px', fontWeight: 'bold', margin: '0', color: theme.cardText
                          }}>
                              {loadingTotalSupply ? '...' : totalSupply} BDB
                          </p>
                      </div>

                      {/* Historial Transacciones */}
                      {transactions.length > 0 && (
                          <div style={{ /* Estilos historial */
                              padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.04)',
                              border: `1px solid ${theme.border}`, marginBottom: '25px'
                          }}>
                              <h3 style={{ color: theme.secondaryText, marginBottom: '10px', fontSize: '15px', textAlign: 'center', fontWeight: '600' }}>
                                  📜 Últimas Transferencias
                              </h3>
                              {transactions.map((tx, index) => (
                                  <div key={index} style={{ /* Estilos item historial */
                                      padding: '8px 10px', background: theme.successBg, borderRadius: '8px',
                                      marginBottom: index === transactions.length - 1 ? '0' : '8px',
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                  }}>
                                      <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: theme.cardText }}>
                                              {tx.type === 'sent' ? '↗️ Enviado' : '↘️ Recibido'} a:
                                          </div>
                                          <div style={{ fontSize: '10px', color: theme.secondaryText, marginTop: '2px' }}>
                                              {tx.address.substring(0, 6)}...{tx.address.substring(50)}
                                          </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: theme.cardText }}>
                                              {tx.amount} BDB
                                          </div>
                                          <div style={{ fontSize: '9px', color: theme.secondaryText, marginTop: '2px' }}>
                                              {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Transferencia */}
                      <div style={{ 
                          padding: '20px', borderRadius: '15px', background: theme.inputBg,
                          border: `1px solid ${theme.border}`
                      }}>
                          <h3 style={{ color: theme.secondaryText, marginBottom: '15px', textAlign: 'center', fontSize: '16px', fontWeight: '600' }}>
                              💸 Transferir BDB
                          </h3>
                          <input
                              type="text" placeholder="Dirección destino (G...)" value={recipient}
                              onChange={e => setRecipient(e.target.value)}
                              style={{ 
                                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                                  border: `1px solid ${theme.border}`, marginBottom: '10px',
                                  background: theme.cardBg, color: theme.cardText, boxSizing: 'border-box', fontSize: '14px'
                              }}
                          />
                          <input
                              type="number" placeholder="Cantidad en BDB (ej: 100)" value={amount}
                              onChange={e => setAmount(e.target.value)} step="0.01" min="0"
                              style={{ 
                                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                                  border: `1px solid ${theme.border}`, marginBottom: '15px',
                                  background: theme.cardBg, color: theme.cardText, boxSizing: 'border-box', fontSize: '14px'
                              }}
                          />
                          <button
                              onClick={handleTransfer}
                              disabled={transferring}
                              style={{ /* Estilos botón transferir */
                                  width: '100%', padding: '12px', borderRadius: '12px', 
                                  background: transferring ? '#ccc' : theme.primaryButton,
                                  color: '#fff', fontWeight: 'bold', border: 'none',
                                  cursor: transferring ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                                  fontSize: '15px', boxShadow: transferring ? 'none' : '0 4px 15px rgba(0,0,0,0.2)'
                              }}
                              onMouseEnter={e => !transferring ? e.currentTarget.style.filter = 'brightness(1.1)' : null}
                              onMouseLeave={e => !transferring ? e.currentTarget.style.filter = 'brightness(1)' : null}
                           >
                              {transferring ? '⏳ Enviando...' : '✨ Enviar Transferencia ✨'}
                          </button>
                      </div>
                  </div>
              )}
          </div>

      </div>
  );
}

export default App;