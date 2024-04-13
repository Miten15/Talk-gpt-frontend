import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as FileSystem from "expo-file-system";
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { Audio } from "expo-av";
import { writeAudioToFile } from './utils/writeAudioToFile';
import { playFromPath } from './utils/playFromPath';
import { fetchAudio } from './utils/fetchAudio';

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});


export default function App() {

  const { state, startRecognizing, stopRecognizing, destroyRecognizer } =
  useVoiceRecognition();

  const [borderColor, setBorderColor] = useState<"lightgray" | "lightgreen">(
    "lightgray"
  );

  const [urlPath, setUrlPath] = useState("");



  const listFiles = async () => {
    try {
      const result = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory!
      );
      if (result.length > 0) {
        const filename = result[0];
        const path = FileSystem.documentDirectory + filename;
        console.log("Full path to the file:", path);
        setUrlPath(path);
      }
    } catch (error) {
      console.error("An error occurred while listing the files:", error);
    }
  };

  const handleSubmit = async () => {
    if (!state.results[0]) return;
    try {
      // Fetch the audio blob from the server
      const audioBlob = await fetchAudio(state.results[0]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          // data:audio/mpeg;base64,....(actual base64 data)...
          const audioData = e.target.result.split(",")[1];

          // Write the audio data to a local file aka save data
          const path = await writeAudioToFile(audioData)

          //play audio
          setUrlPath(path)
          await playFromPath(path)
          destroyRecognizer();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.error("An error occurred:", e);
    }
  };

  return (
    <View style={styles.container}>
     <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 30 }}>
        Talk GPT 🤖
      </Text>
      <Text style={styles.instructions}>
        Press and hold this button to record your voice. Release the button to
        send the recording, and you'll hear a response
      </Text>
     
      <Text style={styles.welcome}>Your message: "{}"</Text>
      <Pressable
       onPressIn={() => {
        setBorderColor("lightgreen");
        startRecognizing();
      }}
      onPressOut={() => {
        setBorderColor("lightgray");
        stopRecognizing();
        handleSubmit();
      }}
      style={{
        width: "90%",
        padding: 30,
        gap: 10,
        borderWidth: 3,
        alignItems: "center",
        borderRadius: 10,
        borderColor: borderColor}}>
        <Text>Hold to speeak</Text>
      </Pressable>
      <Text style={{
        marginVertical: 10,
        fontSize: 17
      }}>{JSON.stringify(state, null, 2)}</Text>


      <Button title='Replay last msg ' onPress={ async()=> {
        await playFromPath(urlPath)

      }} />


      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20
  },
  button: {
    width: 50,
    height: 50,
  },

  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  action: {
    textAlign: "center",
    color: "#0000FF",
    marginVertical: 5,
    fontWeight: "bold",
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
    fontSize: 12,
  },
  stat: {
    textAlign: "center",
    color: "#B0171F",
    marginBottom: 1,
  },
});
