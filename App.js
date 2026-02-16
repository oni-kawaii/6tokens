// IMPORT
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAudioPlayer } from 'expo-audio';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions, // Aggiunto
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync().catch(() => { });
// COPIA QUESTO IN CIMA AL FILE (FUORI DA APP)

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 70;
const COLUMN_WIDTH = (width / 2) - 20;
const AnimatedSkull = ({ bgColor }) => {
  // Uso direttamente useRef e useEffect senza "React." davanti
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startLoop = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 3500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    };

    startLoop();
  }, []);

  return (
    <View style={{ width: 30, height: 30, borderRadius: 17.5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <Animated.View style={{
        position: 'absolute',
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
      }}>
        <MaterialCommunityIcons name="skull" size={28} color={bgColor} />
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        opacity: pulse
      }}>
        <Text style={{ color: bgColor, fontWeight: '900', fontSize: 18, paddingRight: 2, paddingBottom: 2 }}>-2</Text>
      </Animated.View>
    </View>
  );
}; 

export default function App() {
  // --- 1. STATI (HOOKS) ---
  // --- NUOVA GESTIONE AUDIO (Expo Audio) ---
  const drumrollPlayer = useAudioPlayer(require('./assets/sounds/drumroll.mp3'));
  const resetPlayer = useAudioPlayer(require('./assets/sounds/reset.mp3'));

  // Per i token, carichiamo i file in un array di sorgenti
  const tokenSources = [
    require('./assets/sounds/token (1).mp3'),
    require('./assets/sounds/token (2).mp3'),
    require('./assets/sounds/token (3).mp3'),
    require('./assets/sounds/token (4).mp3'),
    require('./assets/sounds/token (5).mp3'),
    require('./assets/sounds/token (6).mp3'),
    require('./assets/sounds/token (7).mp3'),
    require('./assets/sounds/token (8).mp3'),
    require('./assets/sounds/token (9).mp3'),
    require('./assets/sounds/token (10).mp3'),
  ];

  // Usiamo un player dedicato per i token
  const tokenPlayer = useAudioPlayer(tokenSources[0]);

  const [screen, setScreen] = useState('selectNumber');
  const [selectedNumber, setSelectedNumber] = useState(2);
  const [players, setPlayers] = useState([]);
  const scrollRef = useRef(null);

  const [games, setGames] = useState([]);
  const [viewMode, setViewMode] = useState('camera');
  const [isShuttering, setIsShuttering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef(null);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameVotes, setGameVotes] = useState({});
  const inputRefs = useRef([]);
  const [isFirstReset, setIsFirstReset] = useState(true);

  const [showExitModal, setShowExitModal] = useState(false);
  const skullPulseAnim = useRef(new Animated.Value(0)).current;

  const [winner, setWinner] = useState(null);
  const [tieGames, setTieGames] = useState([]);
  const [isTieBreak, setIsTieBreak] = useState(false);
  const [showTieModal, setShowTieModal] = useState(false);
  


  // --- 2. EFFETTI ---
  // Tasto indietro comportamento
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
    const backAction = () => {
      if (screen === 'showPlayers') { setScreen('selectNumber'); return true; }
      if (screen === 'addGames') {
        if (viewMode === 'gallery') { setViewMode('camera'); return true; }
        setScreen('showPlayers');
        return true;
      }
      if (screen === 'voting' || screen === 'passPhone') {
        const hasStartedVoting = currentPlayerIndex > 0 || (gameVotes[currentPlayerIndex]?.positions?.length > 0);

        if (!hasStartedVoting) {
          setGameVotes({});
          setCurrentPlayerIndex(0);
          setScreen('addGames');
          setViewMode('gallery');
        } else {
          // Invece dell'Alert nativo, apriamo il nostro modale
          setShowExitModal(true);
        }
        return true;
      }
      if (screen === 'suspense' || screen === 'winner') {
        return true; // Blocca l'azione
      }
      if (screen === 'showAllVotes') { setScreen('winner'); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [screen, viewMode]);

  // Effetto per resettare la posizione dello scroll quando si torna a 'selectNumber'
  useEffect(() => {
    if (screen === 'selectNumber' && scrollRef.current) {
      const index = numbers.indexOf(selectedNumber);
      if (index !== -1) {
        // Usiamo scrollTo senza animazione per bloccarlo subito
        scrollRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
      }
    }
  }, [screen]);

  //animazione teschio -2
  useEffect(() => {
    const startAnimation = () => {
      skullPulseAnim.setValue(0); // Reset forzato all'inizio
      Animated.loop(
        Animated.sequence([
          Animated.timing(skullPulseAnim, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(skullPulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();

    // Non mettiamo dipendenze così resta attivo finché l'app è aperta
  }, [skullPulseAnim]);

  // --- 3. LOGICA ---
  const colors = [
    { bg: '#EF4444', text: '#FFFFFF' },
    { bg: '#ffcc00', text: '#FFFFFF' },
    { bg: '#1e4cd6', text: '#FFFFFF' },
    { bg: '#adf222', text: '#FFFFFF' },
    { bg: '#ff7700', text: '#FFFFFF' },
    { bg: '#66d4b0', text: '#FFFFFF' },
    { bg: '#6414d4', text: '#FFFFFF' },
    { bg: '#c198c9', text: '#FFFFFF' },
    { bg: '#81c0ff', text: '#FFFFFF' },
    { bg: '#fd4ac7', text: '#FFFFFF' },
  ];

  const numbers = Array.from({ length: 9 }, (_, i) => i + 2);

  // Funzioni audio pulite per Expo Audio
  const playRandomTokenSound = () => {
    try {
      if (tokenPlayer) {
        const randomIndex = Math.floor(Math.random() * tokenSources.length);
        tokenPlayer.replace(tokenSources[randomIndex]);
        tokenPlayer.seekTo(0);
        tokenPlayer.play();
      }
    } catch (e) { console.log("Errore token sound:", e); }
  };

  const playDrumroll = () => {
    if (drumrollPlayer) {
      drumrollPlayer.seekTo(0);
      drumrollPlayer.play();
    }
  };

  const playResetSound = () => {
    if (resetPlayer) {
      // 1. Lo riportiamo all'inizio
      resetPlayer.seekTo(0);

      // 2. Lanciamo il play subito
      resetPlayer.play();

      // 3. Se per caso era "addormentato", ci riproviamo tra 50ms
      // Questo non crea un doppio suono fastidioso perché il file è lo stesso 
      // e sta già suonando o partendo.
      setTimeout(() => {
        if (resetPlayer && !resetPlayer.playing) {
          resetPlayer.play();
        }
      }, 50);
    }
  };
  
  const handleStartVoting = () => {
    const newPlayers = Array.from({ length: selectedNumber }, (_, i) => ({
      defaultName: `Giocatore ${i + 1}`,
      customName: '',
      color: colors[i % colors.length]
    }));
    setPlayers(newPlayers);
    setScreen('showPlayers');
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsShuttering(true);
      setTimeout(() => setIsShuttering(false), 150);
      setIsSaving(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          shutterSound: false, flash: 'off', quality: 0.2, skipHalos: true, exif: false,
        });
        setGames(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(), // Chiave ultra-univoca
          uri: photo.uri
        }]);
        setIsSaving(false);
      } catch (e) {
        console.log("Errore scatto:", e);
        setIsSaving(false);
        setIsShuttering(false);
      }
    }
  };

  const deletePhoto = (id) => {
    setGames(games.filter(g => g.id !== id));
  };

  // --- ANIMAZIONE MONETA ---
  const [fallingTokens, setFallingTokens] = useState([]);

  const animateToken = (gameId, finalPos, rotation, tokenId, isSkull = false) => {
    const animValue = new Animated.Value(0);

    // Lancio solo dai lati: 0 = Sinistra, 1 = Destra
    // Scegliamo solo tra Sinistra (0) e Destra (1)
    const side = Math.floor(Math.random() * 3); // 0: Sinistra, 1: Alto, 2: Destra
    let startX, startY;

    if (side === 0) {
      // SINISTRA
      startX = -width;
      startY = 150 + (Math.random() * (height - 350));
    } else if (side === 1) {
      // ALTO (Ecco il blocco che mancava!)
      // Partiamo dal centro orizzontale casuale
      startX = (Math.random() - 0.5) * width;
      // Invece di 0 o negativo, partiamo da 120 per "saltare" la testata
      startY = -100;
    } else {
      // DESTRA
      startX = width;
      startY = 150 + (Math.random() * (height - 350));
    }

    setFallingTokens(prev => [...prev, {
      id: tokenId,
      gameId,
      animValue,
      finalPos,
      rotation,
      startX,
      startY,
      isSkull // Salviamo se è un teschio
    }]);

    Animated.timing(animValue, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setFallingTokens(prev => prev.filter(t => t.id !== tokenId));

    setGameVotes(prevVotes => {
        const currentVoter = prevVotes[currentPlayerIndex];
        if (!currentVoter || !currentVoter.positions) return prevVotes;
        const newPositions = currentVoter.positions.map(t =>
          t.id === tokenId ? { ...t, isLanding: false } : t
        );
        return { ...prevVotes, [currentPlayerIndex]: { ...currentVoter, positions: newPositions } };
      });
    });
  };

  const handleAddTokenWithAnim = (gameId, event) => {
    // Otteniamo le coordinate del tocco rispetto alla foto (0-100%)

    const { locationX, locationY } = event.nativeEvent;
    const touchX = (locationX / COLUMN_WIDTH) * 100;
    const touchY = (locationY / 180) * 100; // 180 è l'altezza definita nel tuo stile gridItem

    const voterVotes = gameVotes[currentPlayerIndex] || { skull: null, positions: [] };
    const totalSpent = Object.entries(voterVotes)
      .filter(([key]) => key !== 'skull' && key !== 'positions')
      .reduce((sum, [_, val]) => (typeof val === 'number' ? sum + val : sum), 0);

    if (totalSpent < 6) { //metti 600 per debug
      animateToken(gameId);
      handleAddToken(gameId, touchX, touchY); // Passiamo il punto del tocco
    }
  };

  // --- LOGICA VOTO ---
  const handleAddToken = (gameId, touchX, touchY) => {
    setTimeout(() => {
      playRandomTokenSound();
    }, 500);
    const voterVotes = gameVotes[currentPlayerIndex] || { skull: null, positions: [] };
    const currentPositions = voterVotes.positions || [];
    const newVotes = { ...voterVotes };

    const getSafePosition = () => {
      let attempts = 0;
      let pos = { left: 0, top: 0 };
      let isTooClose;

      do {
        pos.left = Math.random() * 65 + 5;
        pos.top = Math.random() * 65 + 5;
        attempts++;

        const distToTouch = Math.sqrt(Math.pow(pos.left - touchX, 2) + Math.pow(pos.top - touchY, 2));

        // ANTI-SOVRAPPOSIZIONE: Controlla sia monete che teschio
        isTooClose = currentPositions
          .filter(p => p.gameId === gameId)
          .some(p => Math.sqrt(Math.pow(pos.left - p.left, 2) + Math.pow(pos.top - p.top, 2)) < 12);

        if (distToTouch < 15 || isTooClose) continue;
        else break;
      } while (attempts < 15);

      return pos;
    };

    const finalPos = getSafePosition();
    const tokenId = `token_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const rotation = `${Math.random() * 60 - 30}deg`;

    const newToken = {
      id: tokenId,
      gameId: gameId,
      left: finalPos.left,
      top: finalPos.top,
      rotation: rotation,
      isLanding: true
    };

    newVotes[gameId] = (voterVotes[gameId] || 0) + 1;
    newVotes.positions = [...currentPositions, newToken];

    animateToken(gameId, finalPos, rotation, tokenId);

    setGameVotes({ ...gameVotes, [currentPlayerIndex]: newVotes });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSkull = (gameId) => {

    const voterVotes = gameVotes[currentPlayerIndex] || { skull: null, positions: [] };

    // Se il teschio è già qui, esce senza vibrare (come da tua richiesta)
    if (voterVotes.skull === gameId) return;

    let currentPositions = Array.isArray(voterVotes.positions) ? voterVotes.positions : [];
    const positionsWithoutSkull = currentPositions.filter(t => !t.id.includes('skull'));

    // ANTI-SOVRAPPOSIZIONE PER IL TESCHIO
    let attempts = 0;
    let finalPos = { left: 50, top: 50 };
    let isTooClose;

    do {
      finalPos.left = Math.random() * 60 + 20;
      finalPos.top = Math.random() * 60 + 20;
      attempts++;

      isTooClose = positionsWithoutSkull
        .filter(p => p.gameId === gameId)
        .some(p => Math.sqrt(Math.pow(finalPos.left - p.left, 2) + Math.pow(finalPos.top - p.top, 2)) < 12);

      if (!isTooClose) break;
    } while (attempts < 15);
    setTimeout(() => {
      playRandomTokenSound();
    }, 500);
    const tokenId = `skull_${Date.now()}`;
    const rotation = `${Math.random() * 60 - 30}deg`;

    const newSkullToken = {
      id: tokenId,
      gameId: gameId,
      left: finalPos.left,
      top: finalPos.top,
      rotation: rotation,
      isLanding: true
    };

    const newPositions = [...positionsWithoutSkull, newSkullToken];

    animateToken(gameId, finalPos, rotation, tokenId, true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    setGameVotes(prev => ({
      ...prev,
      [currentPlayerIndex]: {
        ...voterVotes,
        skull: gameId,
        positions: newPositions
      }
    }));
  };

  const handleRemoveToken = (tokenId, gameId) => {
    const voterVotes = gameVotes[currentPlayerIndex];
    if (voterVotes && voterVotes.positions) {
      const isSkull = tokenId.includes('skull');
      const newVotes = { ...voterVotes };

      // Rimuoviamo il token dall'array grafico
      newVotes.positions = voterVotes.positions.filter(t => t.id !== tokenId);

      if (isSkull) {
        // Se era il teschio, resettiamo anche la proprietà skull
        newVotes.skull = null;
      } else {
        // Se era un token normale, diminuiamo il conteggio numerico
        newVotes[gameId] = Math.max(0, (newVotes[gameId] || 1) - 1);
      }

      setGameVotes({ ...gameVotes, [currentPlayerIndex]: newVotes });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const confirmVote = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (currentPlayerIndex < players.length - 1) {
      setScreen('passPhone');
    } else {
      setScreen('suspense');
    }
  };

  
  // --- NUOVA LOGICA RISULTATI ---

  const calculateWinner = () => {
    const results = games.map(game => {
      let totalScore = 0;
      let totalSkulls = 0;
      let uniqueVoters = new Set();

      Object.keys(gameVotes).forEach(playerIdx => {
        const votes = gameVotes[playerIdx];
        const coinCount = votes[game.id] || 0;
        totalScore += coinCount;
        if (votes.skull === game.id) {
          totalScore -= 2;
          totalSkulls += 1;
        }
        if (coinCount > 0 || votes.skull === game.id) {
          uniqueVoters.add(playerIdx);
        }
      });

      return { ...game, finalScore: totalScore, skullsReceived: totalSkulls, voterCount: uniqueVoters.size };
    });

    // Ordiniamo per trovare i potenziali vincitori
    results.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (a.skullsReceived !== b.skullsReceived) return a.skullsReceived - b.skullsReceived;
      return b.voterCount - a.voterCount;
    });

    const bestScore = results[0].finalScore;
    const bestSkulls = results[0].skullsReceived;
    const bestVoters = results[0].voterCount;

    // Troviamo tutti quelli che hanno esattamente gli stessi parametri del primo
    const winners = results.filter(g =>
      g.finalScore === bestScore &&
      g.skullsReceived === bestSkulls &&
      g.voterCount === bestVoters
    );

    return { winner: winners[0], allWinners: winners };
  };

  // Cerca il tasto TERMINA e assicurati che chiami handleFinishVoting.
  // Poi dentro handleFinishVoting aggiungi questo controllo all'inizio:

  const handleFinishVoting = () => {
    const { winner, allWinners } = calculateWinner();

    if (allWinners.length > 1) {
      if (isTieBreak) {
        // Se siamo già al ballottaggio e c'è ancora pareggio, decidiamo noi a caso
        const randomWinner = allWinners[Math.floor(Math.random() * allWinners.length)];
        setWinner(randomWinner);
        setScreen('suspense');
        playDrumroll();
        setTimeout(() => setScreen('winner'), 2000);
      } else {
        // Primo pareggio: mostra la scelta
        setTieGames(allWinners);
        setScreen('tieChoice');
      }
    } else {
      // Vincitore pulito
      setWinner(winner);
      setScreen('suspense');
      playDrumroll();
      setTimeout(() => setScreen('winner'), 2000);
    }
  };

  const handleFullReset = () => {
    setGameVotes({});
    setGames([]);
    setTieGames([]); // <--- Aggiunto
    setIsTieBreak(false); // <--- Aggiunto
    setCurrentPlayerIndex(0);
    setWinner(null);
    setScreen('showPlayers');
  };



  // --- 4. RENDERING ---
  // --- FUNZIONE PER IL MODALE DI USCITA ---
  const renderExitModal = () => (
    <Modal
      statusBarTranslucent={true}
      visible={showExitModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowExitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Abbandonare?</Text>
          <Text style={styles.modalMessage}>
            Se esci ora, tutti i voti di questa sessione verranno persi definitivamente.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#f3f4f6' }]}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={{ fontWeight: 'bold', color: '#4b5563' }}>ANNULLA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
              onPress={() => {
                setShowExitModal(false);
                setGameVotes({});
                setCurrentPlayerIndex(0);
                setScreen('addGames');
                setViewMode('gallery');
              }}
            >
              <Text style={{ fontWeight: 'bold', color: '#fff' }}>ABBANDONA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- SCHERMATA PAREGGIO (BIVIO) ---
  if (screen === 'tieChoice') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }]}>
        <Text style={{ color: '#fbbf24', fontSize: 40, fontWeight: 'bold', marginBottom: 10 }}>PAREGGIO!</Text>
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
          {tieGames.length} giochi sono finiti a pari merito.{"\n"}Cosa volete fare?
        </Text>

        <TouchableOpacity
          style={[styles.buttonLarge, { backgroundColor: '#2563eb' }]}
          onPress={() => {
            setIsTieBreak(true);
            setGameVotes({});
            setCurrentPlayerIndex(0);
            setScreen('passPhone');
          }}
        >
          <Text style={styles.buttonText}>BALLOTTAGGIO RAPIDO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonLarge, { backgroundColor: '#10b981', marginTop: 20 }]}
          onPress={() => {
            const randomWinner = tieGames[Math.floor(Math.random() * tieGames.length)];
            setWinner(randomWinner);
            setScreen('suspense');
            playDrumroll();
            setTimeout(() => setScreen('winner'), 2000);
          }}
        >
          <Text style={styles.buttonText}>SCELTA CASUALE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // SCHERMATA SUSPENSE
  if (screen === 'suspense') {
    return (
      <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20 }}>IL VINCITORE È...</Text>
      </View>
    );
  }

  // 2. SCHERMATA VINCITORE
  if (screen === 'winner' && winner) {
    return (
      <View style={[styles.container, { backgroundColor: '#111827', alignItems: 'center' }]}>
        <View style={{ marginTop: 80, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>🏆 VINCITORE!</Text>
          <View style={styles.winnerImageContainer}>
            <Image source={{ uri: winner.uri }} style={styles.winnerImage} />
          </View>
          <View style={{ width: '100%', alignItems: 'center', marginTop: 50, gap: 15 }}>
            <TouchableOpacity style={styles.buttonLarge} onPress={() => setScreen('showAllVotes')}>
              <Text style={styles.buttonText}>VISUALIZZA VOTAZIONI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonLarge, { backgroundColor: '#374151' }]} onPress={handleFullReset}>
              <Text style={styles.buttonText}>NUOVA PARTITA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 3. SCHERMATA TUTTE LE VOTAZIONI (GRIGLIA RIORDINATA)
  if (screen === 'showAllVotes') {
    const sortedGames = [...games].sort((a, b) => {
      const getScore = (id) => Object.values(gameVotes).reduce((acc, v) => acc + (v[id] || 0) - (v.skull === id ? 2 : 0), 0);
      return getScore(b.id) - getScore(a.id);
    });

    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.galleryHeader, { height: 130, paddingTop: 60 }]}>
          <TouchableOpacity onPress={() => setScreen('winner')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AntDesign name="arrow-left" size={20} color="white" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>RISULTATI</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingTop: 40, paddingBottom: 200, paddingHorizontal: 15 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {sortedGames.map((game, index) => {
              let score = 0;
              const tks = []; const sks = [];
              Object.keys(gameVotes).forEach(pIdx => {
                const v = gameVotes[pIdx]; const p = players[pIdx];
                score += (v[game.id] || 0) - (v.skull === game.id ? 2 : 0);
                for (let i = 0; i < (v[game.id] || 0); i++) tks.push({ c: p.color.bg, id: `${pIdx}-${i}` });
                if (v.skull === game.id) sks.push({ c: p.color.bg, id: pIdx });
              });

              const podio = ['#FFD700', '#C0C0C0', '#CD7F32'];
              return (
                <View key={game.id} style={[styles.gridItem, { borderColor: index < 3 ? podio[index] : 'transparent', borderWidth: index < 3 ? 4 : 0 }]}>
                  <Image source={{ uri: game.uri }} style={styles.gridImage} />
                  <View style={styles.votesOverlay}>{tks.map(t => <View key={t.id} style={[styles.miniToken, { backgroundColor: t.c }]} />)}</View>
                  <View style={styles.skullsBottomRight}>{sks.map(s => <View key={s.id} style={[styles.miniToken, { backgroundColor: '#FFF', borderColor: s.c }]}><MaterialCommunityIcons name="skull" size={10} color={s.c} /></View>)}</View>
                  <View style={[styles.scoreBadge, { backgroundColor: index < 3 ? podio[index] : '#111827' }]}><Text style={[styles.scoreBadgeText, { color: index === 0 ? '#000' : '#fff' }]}>{score}</Text></View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // SCHERMATA PASSAGGIO (FULL COLOR)
  if (screen === 'passPhone') {
    // Se non hanno ancora votato (voti vuoti per l'indice attuale), è il primo turno
    const targetPlayer = gameVotes[currentPlayerIndex] ? players[currentPlayerIndex + 1] : players[currentPlayerIndex];
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.container, { backgroundColor: targetPlayer.color.bg, justifyContent: 'center', alignItems: 'center' }]}
        onPress={() => {
          if (gameVotes[currentPlayerIndex]) setCurrentPlayerIndex(currentPlayerIndex + 1);
          setScreen('voting');
        }}
      >
        {renderExitModal()}
        <Text style={{ color: targetPlayer.color.text, fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
          {targetPlayer.customName || targetPlayer.defaultName}
        </Text>
        <Text style={{ color: targetPlayer.color.text, fontSize: 16, marginTop: 40, opacity: 1, textAlign: 'center' }}>TOCCA LO SCHERMO {"\n"}PER INIZIARE A VOTARE</Text>
      </TouchableOpacity>
    );
  }

  // SCHERMATA VOTING
  if (screen === 'voting') {
    const currentPlayer = players[currentPlayerIndex];
    const voterVotes = gameVotes[currentPlayerIndex] || { skull: null, positions: [] };

    // Conta fisicamente quante monete ci sono nell'array
    const coinsPlaced = Array.isArray(voterVotes.positions)
      ? voterVotes.positions.filter(t => !t.id.includes('skull')).length
      : 0;

    // Valore 1 per ogni moneta
    const totalSpent = coinsPlaced;

    return (

      <View style={[styles.container, { paddingTop: 0 }]}>
        {renderExitModal()}
        {/* HEADER CUSTOMIZZATO CON NOTCH */}
        <View style={{ width: '100%', height: 100, backgroundColor: currentPlayer.color.bg, position: 'relative', zIndex: 10 }} />
        <View style={styles.votingHeaderNotch}>
          <View style={[styles.playerTab, { backgroundColor: currentPlayer.color.bg }]}>
            <Text style={styles.playerNameText}>
              {currentPlayer.customName || currentPlayer.defaultName}
            </Text>

          </View>

        </View>
        {/* SFUMATURA COPRENTE VERSO IL BASSO */}
        <LinearGradient
          // Parte dal colore pieno del giocatore e va verso il trasparente (0% opacità)
          colors={['#111827', 'rgba(0,0,0,0)']}
          style={{
            position: 'absolute',
            top: 100, // Parte esattamente dove finisce il rettangolo alto 100
            left: 0,
            right: 0,
            height: 60, // Aumentato a 60 per un effetto più morbido e coprente
            zIndex: 4, // Valore alto per coprire foto e monete (che hanno zIndex < 20)
          }}
          pointerEvents="none" // Indispensabile per cliccare le foto sotto
        />

        <ScrollView
          style={{ flex: 1, overflow: 'visible', backgroundColor: '#111827', }} // <--- overflow visible qui è la chiave
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 30, paddingBottom: 280 }}
          bounces={false}
          overScrollMode="never">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
          >
              {(isTieBreak ? tieGames : games).map((game) => {
              const tokens = voterVotes[game.id] || 0;
              const hasSkull = voterVotes.skull === game.id;
              const isAnimating = fallingTokens.some(t => t.gameId === game.id);
              return (
                <View key={game.id} style={[styles.gridItem, { zIndex: isAnimating ? 5 : 1, elevation: isAnimating ? 5 : 0, position: 'relative', overflow: 'visible' }]}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => handleAddTokenWithAnim(game.id, e)} // Passiamo l'evento qui
                    onLongPress={() => handleSkull(game.id)}
                    style={{ flex: 1 }}
                  >
                    <Image source={{ uri: game.uri }} style={styles.gridImage} />

                    {/* MONETE CHE CADONO */}
                    {fallingTokens.filter(t => t.gameId === game.id).map(t => {
                      if (!t.finalPos) return null;

                      return (
                        <Animated.View
                          key={t.id}
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            left: `${t.finalPos.left}%`,
                            top: `${t.finalPos.top}%`,
                            zIndex: 9999,
                            transform: [
                              { perspective: 1000 },
                              { translateX: t.animValue.interpolate({ inputRange: [0, 1], outputRange: [t.startX, 0] }) },
                              { translateY: t.animValue.interpolate({ inputRange: [0, 1], outputRange: [t.startY, 0] }) },
                              { scale: t.animValue.interpolate({ inputRange: [0, 1], outputRange: [5, 1] }) },
                              { rotateX: t.animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] }) },
                              { rotateY: t.animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                              { rotate: t.rotation }
                            ],
                            opacity: t.animValue.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] })
                          }}
                        >
                          <View style={[styles.tokenDotLarge, { backgroundColor: '#FFF', position: 'absolute', transform: [{ translateY: 1 }] }]} />
                          <View style={[styles.tokenDotLarge, { backgroundColor: t.id.includes('skull') ? '#FFFFFF' : currentPlayer.color.bg, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
                            {t.isSkull && (
                              <MaterialCommunityIcons name="skull" size={28} color={currentPlayer.color.bg} />
                            )}
                          </View>
                        </Animated.View>
                      );
                    })}

                    <View style={StyleSheet.absoluteFill}>

                      {/* TOKEN GIÀ ATTERRATI */}
                      {Array.isArray(voterVotes?.positions) && voterVotes.positions
                        .filter(t => t.gameId === game.id && t.isLanding !== true)
                        .map((token) => (
                          <TouchableOpacity
                            key={token.id}
                            onPress={() => handleRemoveToken(token.id, game.id)}
                            style={[
                              styles.tokenDotLarge,
                              {
                                position: 'absolute',
                                backgroundColor: token.id.includes('skull') ? '#FFFFFF' : currentPlayer.color.bg,
                                left: `${token.left}%`,
                                top: `${token.top}%`,
                                transform: [{ rotate: token.rotation }],
                                borderWidth: 2,
                                borderColor: '#FFF',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }
                            ]}
                          >
                            {/* Se il token ha un ID che contiene 'skull' (o se aggiungi una proprietà isSkull al token) */}
                            {token.id.includes('skull') && (
                              <MaterialCommunityIcons name="skull" size={28} color={currentPlayer.color.bg} />
                            )}
                          </TouchableOpacity>
                        ))}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* CONTENITORE COMANDI IN BASSO (Tasti + Dashboard) */}
        <View style={{ position: 'absolute', bottom: 140, width: '100%', alignItems: 'center', zIndex: 100 }}>

          {/* DASHBOARD TOKEN (7 Slot) */}
          <View style={[styles.dashboardContainer, { width: '100%' }]}>
            <View style={[styles.tokenSlotsRow, { justifyContent: 'center' }]}>
              {/* 6 SLOT MONETE */}
              {[...Array(6)].map((_, i) => {
                const isFilled = i < (6 - totalSpent);
                return (
                  <View key={i} style={styles.slotCircle}>
                    {isFilled ? (
                      <View style={[styles.tokenDotDashboard, { backgroundColor: currentPlayer.color.bg }]} />
                    ) : (
                      <View style={styles.slotEmpty} />
                    )}
                  </View>
                );
              })}

              {/* SEPARATORE VERTICALE */}
              <View style={{ width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 5 }} />

              {/* SLOT TESCHIO ANIMATO */}
              <View style={styles.slotCircle}>
                {!voterVotes.skull ? (
                  <AnimatedSkull bgColor={currentPlayer.color.bg} />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      const skullToken = voterVotes.positions.find(t => t.id.includes('skull'));
                      if (skullToken) handleRemoveToken(skullToken.id, skullToken.gameId);
                    }}
                    style={[styles.slotEmpty, { justifyContent: 'center', alignItems: 'center', paddingBottom: 2 }]}
                  >
                    <Ionicons name="arrow-undo" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* RIGA TASTI (Reset + Conferma) */}
          <View style={{ flexDirection: 'row', width: '80%', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
            {/* TASTO RESET (X) */}
            <TouchableOpacity
              style={[styles.buttonSquare, { backgroundColor: '#374151' }]}
              onPress={() => {
                if (isFirstReset) {
                  // PRIMA VOLTA: Doppia chiamata tattica
                  playResetSound();
                  setTimeout(() => {
                    playResetSound();
                    setIsFirstReset(false); // Segniamo che il "ghiaccio è rotto"
                  }, 50);
                } else {
                  // VOLTE SUCCESSIVE: Chiamata singola normale
                  playResetSound();
                }

                // Resto della logica (Vibrazione e pulizia voti)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setTimeout(() => {
                  setGameVotes(prev => ({
                    ...prev,
                    [currentPlayerIndex]: { skull: null, positions: [] }
                  }));
                }, 200);
              }}
            >
              <Text style={styles.buttonText}>
                <MaterialIcons name="refresh" size={24} />
              </Text>
            </TouchableOpacity>

            {/* TASTO FATTO (Più piccolo e a destra) */}
            <TouchableOpacity
              style={[
                styles.buttonFattoSmall,
                { backgroundColor: totalSpent >= 6 ? '#2563eb' : '#374151' }
              ]}
              disabled={totalSpent < 6}
              onPress={currentPlayerIndex < players.length - 1 ? confirmVote : handleFinishVoting} // <--- QUI
            >
              <Text style={styles.buttonText}>
                {currentPlayerIndex < players.length - 1 ? 'FATTO' : 'TERMINA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(17, 24, 39, 0.8)', '#111827']}
          locations={[0, 0.7, 0.8]} // Regola lo 0.3 per decidere dove inizia a diventare "pesante"
          style={styles.bottomGalleryGradient}
          pointerEvents="none"
        />
      </View>
    );
  }

  // SCREEN FOTOCAMERA + GALLERIA
  if (screen === 'addGames') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: 0 }]}>
          {viewMode === 'camera' ? (
            <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center' }}>
              {/* ANTEPRIMA RISTRETTA */}
              <View style={{
                width: width * 0.9,
                height: width * 0.9,
                marginTop: 100,
                overflow: 'hidden',
                borderRadius: 25,
                transform: [{ scale: isShuttering ? 0.95 : 1 }],
                backgroundColor: '#000',
                position: 'relative' // Assicura che i figli assoluti si riferiscano a questo box
              }}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} flash="off" animateShutter={false} />

                {/* L'overlay ora è fuori dalla CameraView, ma sopra di essa grazie alla posizione assoluta */}
                <View style={[StyleSheet.absoluteFill, styles.cameraOverlay]} pointerEvents="none" />
              </View>

              {/* BARRA COMANDI FOTOCAMERA */}
              <View style={[styles.fixedBottomBarClean, { bottom: 240 }]}>
                <View style={styles.cameraBottomBarClean}>
                  <View style={{ width: 60 }} />
                  <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
                    <View style={styles.captureBtnInternal} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.galleryIconBtn} onPress={() => setViewMode('gallery')}>
                    <View style={[styles.badge, { transform: [{ scale: isSaving ? 1.2 : 1 }] }]}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.badgeText}>{games.length}</Text>
                      )}
                    </View>
                    <View style={styles.galleryCircle}>
                      <Text style={{ fontSize: 24 }}>🖼️</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // GALLERIA
            <View style={{ flex: 1, }}>
              <View style={[styles.galleryHeader, { height: 130, paddingTop: 60 }]}>
                <TouchableOpacity
                  onPress={() => setViewMode('camera')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <AntDesign name="arrow-left" size={20} color="white" />
                  <Entypo name="camera" size={26} color="white" />
                </TouchableOpacity>

                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  ELEMENTI: {games.length}
                </Text>
              </View>
              <LinearGradient
                // Parte dal colore pieno del giocatore e va verso il trasparente (0% opacità)
                colors={['#111827', 'rgba(0,0,0,0)']}
                style={{
                  position: 'absolute',
                  top: 130, // Parte esattamente dove finisce il rettangolo alto 100
                  left: 0,
                  right: 0,
                  height: 60, // Aumentato a 60 per un effetto più morbido e coprente
                  zIndex: 4, // Valore alto per coprire foto e monete (che hanno zIndex < 20)
                }}
                pointerEvents="none" // Indispensabile per cliccare le foto sotto
              />

              <ScrollView
                style={{ flex: 1, backgroundColor: '#111827' }}
                contentContainerStyle={{
                  paddingTop: 40,
                  paddingBottom: 280,
                  paddingHorizontal: 15
                }}
                bounces={false}
                overScrollMode="never">

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {games.map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      {/* Usiamo TouchableWithoutFeedback per eliminare l'effetto trasparenza */}
                      <TouchableWithoutFeedback>
                        <View style={{ flex: 1 }}>
                          <Image source={{ uri: item.uri }} style={styles.gridImage} />

                          <TouchableOpacity
                            onPress={() => deletePhoto(item.id)}
                            style={styles.deleteBadge}
                          >
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <LinearGradient
                colors={['transparent', 'rgba(17, 24, 39, 0.8)', '#111827']}
                locations={[0, 0.7, 0.8]} // Regola lo 0.3 per decidere dove inizia a diventare "pesante"
                style={styles.bottomGalleryGradient}
                pointerEvents="none"
              />
            </View>
          )}

          {/* TASTO FATTO FISSO IN BASSO (stessa altezza delle altre schermate) */}
          <View style={{ position: 'absolute', bottom: 140, width: '100%', alignItems: 'center', zIndex: 100 }}>
            <TouchableOpacity
              style={[styles.buttonLarge, games.length < 2 && { opacity: 0.5 }, { marginTop: 0 }]}
              onPress={() => setScreen('passPhone')}
              disabled={games.length < 2}
            >
              <Text style={styles.buttonText}>FATTO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }
  // SCREEN SHOW PLAYERS
  if (screen === 'showPlayers') {
    return (
      <View style={styles.container}>

        {/* 1. IL BLOCCO CIECO (Copre lo stretch superiore) */}
        <View style={{
          position: 'absolute',
          top: -100,
          left: 0,
          right: 0,
          height: 200, // Copre fino a 100px sotto il limite
          backgroundColor: '#111827',
          zIndex: 100,
        }} />

        {/* 2. SFUMATURA SUPERIORE (Sotto il blocco cieco) */}
        {players.length >= 6 && (
          <LinearGradient
            colors={['#111827', 'transparent']}
            style={{ position: 'absolute', top: 100, left: 0, right: 0, height: 60, zIndex: 90 }}
            pointerEvents="none"
          />
        )}

        {/* 3. LISTA (Tutta la pagina trascina) */}
        <ScrollView
          style={{ flex: 1, marginTop: 30 }}
          // Se i giocatori sono meno di 6, lo scroll viene disattivato
          scrollEnabled={players.length >= 6}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 120, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {players.map((player, index) => (
            <View key={index} style={[styles.playerRow, { backgroundColor: player.color.bg }]}>
              <TextInput
                ref={(el) => (inputRefs.current[index] = el)}
                style={[styles.playerInput, { color: player.color.text, textAlign: 'left', flex: 1 }]}
                placeholder={player.defaultName}
                placeholderTextColor="rgb(255, 255, 255)" // Lasciato come lo avevi tu
                value={player.customName}
                onChangeText={(text) => {
                  const newPlayers = [...players];
                  newPlayers[index].customName = text;
                  setPlayers(newPlayers);
                }}
              />

              {/* BOTTONE MATITA (Unica zona che attiva l'input) */}
              <TouchableOpacity
                onPress={() => inputRefs.current[index].focus()}
                style={{ paddingHorizontal: 15, paddingVertical: 10 }}
              >
                <Text style={{ color: player.color.text, fontSize: 22, opacity: 0.8, transform: [{ scaleX: -1 }] }}>
                  ✎
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* 4. SFUMATURA INFERIORE */}
        {players.length >= 6 && (
          <LinearGradient
            colors={['transparent', '#111827']}
            style={{ position: 'absolute', bottom: 220, left: 0, right: 0, height: 60, zIndex: 90 }}
            pointerEvents="none"
          />
        )}

        {/* 5. AREA TASTO AVANTI */}
        <View style={{ paddingBottom: 140, alignItems: 'center', zIndex: 110 }}>
          <TouchableOpacity style={styles.buttonLarge} onPress={() => setScreen('addGames')}>
            <Text style={styles.buttonText}>AVANTI</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // SCREEN SELECT NUMBER
  if (screen === 'selectNumber') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>SELEZIONA</Text>
          <Text style={styles.title}>NUMERO GIOCATORI</Text>
          <View style={styles.pickerContainer}>
            <LinearGradient colors={['transparent', '#ffffff', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.selectionLine, { top: ITEM_HEIGHT * 2 }]} />
            <LinearGradient colors={['transparent', '#ffffff', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.selectionLine, { top: ITEM_HEIGHT * 3 }]} />
            <ScrollView
              ref={scrollRef}
              // Questa riga dice alla lista di partire già dalla posizione corretta
              contentOffset={{ x: 0, y: numbers.indexOf(selectedNumber) * ITEM_HEIGHT }}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (numbers[index] !== undefined && numbers[index] !== selectedNumber) {
                  setSelectedNumber(numbers[index]);
                  Haptics.selectionAsync();
                }
              }}
              contentContainerStyle={{ paddingTop: ITEM_HEIGHT * 1.9, paddingBottom: ITEM_HEIGHT * 2.05 }}
              style={styles.scrollViewStyle}
            >
              {numbers.map((num) => (
                <View key={num} style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
                  <Text style={[styles.numberText, selectedNumber === num ? styles.numberSelected : styles.numberUnselected]}>{num}</Text>
                </View>
              ))}
            </ScrollView>
            <LinearGradient colors={['#111827', 'rgba(17, 24, 39, 0)']} style={[styles.gradientMask, { top: 0 }]} pointerEvents="none" />
            <LinearGradient colors={['rgba(17, 24, 39, 0)', '#111827']} style={[styles.gradientMask, { bottom: 0 }]} pointerEvents="none" />
          </View>
          <TouchableOpacity style={styles.buttonLarge} onPress={handleStartVoting}><Text style={styles.buttonText}>AVANTI</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  // PLACEHOLDER RISULTATI
  if (screen === 'placeholder') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.header}>🏆 RISULTATI</Text>
        <TouchableOpacity style={styles.buttonLarge} onPress={() => setScreen('selectNumber')}><Text style={styles.buttonText}>RICOMINCIA</Text></TouchableOpacity>
      </View>
    );
  }

  return null;
}


// STILI
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 20 },
  title: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 5 },
  numberText: { textAlign: 'center' },
  numberUnselected: { color: '#ffffff', fontSize: 32, opacity: 0.5 },
  numberSelected: { color: '#ffffff', fontSize: 52, fontWeight: 'bold' },
  pickerContainer: { height: ITEM_HEIGHT * 5, width: '100%', marginVertical: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  scrollViewStyle: { width: '100%', flexGrow: 0 },
  selectionLine: { position: 'absolute', height: 2, width: '60%', zIndex: 1 },
  gradientMask: { position: 'absolute', left: 0, right: 0, height: ITEM_HEIGHT * 1.5, zIndex: 2 },
  playerRow: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  playerInput: { flex: 1, fontSize: 18, fontWeight: 'bold' },
  buttonLarge: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 15, width: '80%', marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
  cameraOverlay: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20 },
  fixedBottomBarClean: { position: 'absolute', bottom: 0, width: '80%', backgroundColor: 'transparent' },
  cameraBottomBarClean: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 20 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureBtnInternal: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  galleryIconBtn: { alignItems: 'center', width: 60 },
  galleryCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 11, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, zIndex: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  gridItem: { width: COLUMN_WIDTH, height: 180, marginBottom: 10, borderRadius: 15, backgroundColor: '#1f2937' },
  gridImage: { width: '100%', height: '100%', borderRadius: 15 },
  deleteBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#ef4444', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  bottomGalleryGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250, zIndex: 10 },
  moveControlsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, alignItems: 'center', borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  arrow: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // STILI VOTING
  tokenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  tokensGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '80%' },
  tokenDotLarge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3, // Bordo leggermente più spesso
    borderColor: 'rgba(255,255,255,0.8)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  fixedBottomButton: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  votingHeaderNotch: {
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 10,
  },
  playerTab: {
    height: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  dashboardContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)', // Grigio scuro con opacità
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tokenSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotCircle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    // Rimuovi eventuali bordi o background da qui se presenti
  },
  slotEmpty: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  tokenDotDashboard: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'solid',
    justifyContent: 'center', // <--- Centra orizzontalmente
    alignItems: 'center',     // <--- Centra verticalmente
  },
  buttonSquare: {
    width: 60, // Altezza coerente con buttonLarge ma quadrato
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonFattoSmall: {
    flex: 1, // Prende lo spazio rimanente a destra
    height: 60,
    borderRadius: 15,
    marginLeft: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  //modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Sfondo semitrasparente che oscura l'app
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25, // Bordi belli arrotondati come volevi
    padding: 25,
    alignItems: 'center',
    elevation: 10, // Ombra su Android
    shadowColor: '#000', // Ombra su iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15, // Pulsanti arrotondati
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalBtnCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalBtnExit: {
    backgroundColor: '#ef4444', // Rosso per l'uscita
  },
  modalBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  winnerImageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#fbbf24', // Oro
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  miniToken: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  winnerImageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#fbbf24',
    overflow: 'hidden',
  },
  winnerImage: { width: '100%', height: '100%' },
  votesOverlay: { position: 'absolute', top: 5, left: 5, right: 5, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  skullsBottomRight: { position: 'absolute', bottom: 5, right: 5, flexDirection: 'row', gap: 3 },
  miniToken: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scoreBadge: { position: 'absolute', bottom: 0, left: 0, paddingHorizontal: 8, paddingVertical: 2, borderTopRightRadius: 8, borderBottomLeftRadius: 10 },
  scoreBadgeText: { fontWeight: 'bold', fontSize: 12 },
});