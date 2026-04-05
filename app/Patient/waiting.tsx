import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PatientDetails() {
  const params = useLocalSearchParams();

  const data = JSON.parse(params.patient as string);

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ fontSize:50, fontWeight:'bold', marginBottom:20 }}>
        #{data.queue}
      </Text>

      <Text style={{ fontSize:20 }}>{data.name}</Text>
    </View>
  );
}