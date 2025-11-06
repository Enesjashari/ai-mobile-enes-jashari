import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from './supabaseClient';

export default function VerifyScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState('');

  const verifyCode = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !data) return Alert.alert('Invalid code.');

    // Mark verified
    await supabase
      .from('users')
      .update({ verified: true, verification_code: null })
      .eq('email', email);

    Alert.alert('Verification successful!');
    navigation.navigate('Tasks', { user: data });
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Enter 6-digit code sent to {email}
      </Text>
      <TextInput
        placeholder="Enter code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        style={{ borderWidth: 1, marginBottom: 20, padding: 10 }}
      />
      <Button title="Verify" onPress={verifyCode} />
    </View>
  );
}
