// IMPORT
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'; // IMPORT PER IL DRAG STILE HOME
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


SplashScreen.preventAutoHideAsync().catch(() => { });

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 70;
const COLUMN_WIDTH = (width / 2) - 20;

export default function App() {
  // --- 1. STATI (HOOKS) ---
  const [screen, setScreen] = useState('selectNumber');
  const [selectedNumber, setSelectedNumber] = useState(2);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [viewMode, setViewMode] = useState('camera');

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameVotes, setGameVotes] = useState({});

  const inputRefs = useRef([]);
  const cameraRef = useRef(null);
  const scrollRef = useRef(null);
  const [isShuttering, setIsShuttering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 2. EFFETTI ---
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
        // RESET TOTALE: svuota tutti i voti e torna al primo giocatore
        setGameVotes({});
        setCurrentPlayerIndex(0);
        setScreen('addGames');
        setViewMode('gallery');
        return true;
      }
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

    const side = Math.floor(Math.random() * 3); // 0: Sinistra, 1: Alto, 2: Destra
    let startX, startY;

    if (side === 0) { // Da sinistra
      startX = -width;
      startY = (Math.random() - 0.5) * height;
    } else if (side === 1) { // Dall'alto
      startX = (Math.random() - 0.5) * width;
      startY = -height;
    } else { // Da destra
      startX = width;
      startY = (Math.random() - 0.5) * height;
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
      setScreen('placeholder');
    }
  };

  // --- 4. RENDERING ---

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
        <Text style={{ color: targetPlayer.color.text, fontSize: 18, opacity: 0.8, marginBottom: 10 }}>TOCCA A:</Text>
        <Text style={{ color: targetPlayer.color.text, fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
          {targetPlayer.customName || targetPlayer.defaultName}
        </Text>
        <Text style={{ color: targetPlayer.color.text, fontSize: 16, marginTop: 40, opacity: 0.7 }}>TOCCA LO SCHERMO PER INIZIARE A VOTARE</Text>
      </TouchableOpacity>
    );
  }

  // SCHERMATA VOTING
  if (screen === 'voting') {
    const currentPlayer = players[currentPlayerIndex];
    const voterVotes = gameVotes[currentPlayerIndex] || { skull: null };
    const totalSpent = Object.entries(voterVotes)
      .filter(([key]) => key !== 'skull')
      .reduce((sum, [_, val]) => (typeof val === 'number' ? sum + val : sum), 0);

    return (

      <View style={styles.container}>
        <View style={[styles.galleryHeader, { marginTop: 40 }]}>
          <View>
            <Text style={{ color: currentPlayer.color.bg, fontWeight: 'bold', fontSize: 14 }}>GIOCATORE:</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{currentPlayer.customName || currentPlayer.defaultName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#fff', opacity: 0.6 }}>TOKEN</Text>
            <Text style={{ color: totalSpent === 6 ? '#adf222' : '#fff', fontSize: 22, fontWeight: 'bold' }}>{totalSpent}/6</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, overflow: 'visible' }} // <--- overflow visible qui è la chiave
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 30, paddingBottom: 280 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {games.map((game) => {
              const tokens = voterVotes[game.id] || 0;
              const hasSkull = voterVotes.skull === game.id;
              const isAnimating = fallingTokens.some(t => t.gameId === game.id);
              return (
                <View key={game.id} style={[styles.gridItem, { zIndex: isAnimating ? 999 : 1, elevation: isAnimating ? 10 : 0, position: 'relative', overflow: 'visible' }]}>
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
                                alignItems: 'center'
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
        <View style={{ position: 'absolute', bottom: 140, width: '100%', alignItems: 'center', zIndex: 100 }}>
          <TouchableOpacity
            style={[styles.buttonLarge, { backgroundColor: totalSpent === 6 ? '#2563eb' : '#374151', marginTop: 0 }]}
            disabled={totalSpent < 6}
            onPress={confirmVote}
          >
            <Text style={styles.buttonText}>{currentPlayerIndex < players.length - 1 ? 'FATTO' : 'TERMINA'}</Text>
          </TouchableOpacity>
        </View>
        <LinearGradient colors={['transparent', '#111827']} style={styles.bottomGalleryGradient} pointerEvents="none" />
      </View>
    );
  }

  // SCREEN FOTOCAMERA + GALLERIA
  if (screen === 'addGames') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
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
            <View style={{ flex: 1, paddingTop: 60 }}>
              <View style={styles.galleryHeader}>
                <TouchableOpacity onPress={() => setViewMode('camera')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AntDesign name="arrow-left" size={20} color="white" />
                  <Entypo name="camera" size={26} color="white" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>ELEMENTI: {games.length}</Text>
              </View>

              <DraggableFlatList contentContainerStyle={{ paddingBottom: 280 }}
                data={games}
                onDragEnd={({ data }) => {
                  setGames(data);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15 }}
                renderItem={({ item, drag, isActive }) => (
                  <ScaleDecorator>
                    <TouchableOpacity
                      onLongPress={drag}
                      activeOpacity={1}
                      style={[styles.gridItem, { opacity: isActive ? 0.3 : 1 }]}
                    >
                      <Image source={{ uri: item.uri }} style={styles.gridImage} />
                      <TouchableOpacity onPress={() => deletePhoto(item.id)} style={styles.deleteBadge}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </ScaleDecorator>
                )}
              />
              <LinearGradient colors={['transparent', '#111827']} style={styles.bottomGalleryGradient} pointerEvents="none" />
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
  gridItem: { width: COLUMN_WIDTH, height: 180, marginBottom: 20, borderRadius: 15, backgroundColor: '#1f2937' },
  gridImage: { width: '100%', height: '100%', borderRadius: 15 },
  deleteBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#ef4444', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15, // Un po' di margine sotto l'header
    marginTop: 10     // Un po' di margine sopra
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
});