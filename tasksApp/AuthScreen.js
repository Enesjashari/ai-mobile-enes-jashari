import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { supabase } from './supabaseClient';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Temp: Set to true to bypass email sending and user deletion (for testing registration)
  const BYPASS_EMAIL = false; // Change to true if emails fail but you want to test DB insert

  // Update this to your server URL (localhost for web/emulator, IP for device)
  const EMAIL_SERVER_URL = 'http://10.147.130.181:3001/send-code'; // Or 'http://localhost:3001' for web

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const sendVerificationEmail = async (email, code) => {
    if (BYPASS_EMAIL) {
      console.log('BYPASS_EMAIL: Skipping email send for testing');
      return { success: true };
    }

    try {
      console.log('Sending verification email to:', email, 'with code:', code);
      console.log('Fetching from URL:', EMAIL_SERVER_URL);
      
      const response = await fetch(EMAIL_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${code}`
        }),
      });

      console.log('Email response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      const data = await response.json();
      console.log('Email send response:', data);
      return data;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      console.log('Starting auth process:', isLogin ? 'login' : 'register');
      console.log('Email:', email.toLowerCase());
      
      if (isLogin) {
        // LOGIN FLOW
        console.log('Checking existing user...');
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (selectError) {
          console.error('Select error:', selectError);
          throw new Error('Database query failed - check RLS policies');
        }

        if (!existingUser || existingUser.password !== password) {
          throw new Error('Invalid email or password');
        }

        console.log('User found, verified:', existingUser.verified);

        if (!existingUser.verified) {
          // Generate new verification code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          console.log('Generated new code:', code);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ verification_code: code })
            .eq('email', email.toLowerCase());

          if (updateError) {
            console.error('Update code error:', updateError);
            throw new Error('Failed to update verification code');
          }

          // Send new verification email
          await sendVerificationEmail(email.toLowerCase(), code);
          
          Alert.alert('Check Email', 'New verification code sent. Enter it to proceed.');
          navigation.navigate('Verify', { email: email.toLowerCase() });
          return;
        }

        console.log('User verified, navigating to Tasks');
        navigation.navigate('Tasks', { user: existingUser });
      } else {
        // REGISTER FLOW
        console.log('Starting registration for:', email.toLowerCase());
        
        // Check if email exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows, ok
          console.error('Check existing error:', checkError);
          throw new Error('Database query failed - check RLS policies');
        }

        if (existingUser) {
          throw new Error('Email already registered');
        }

        // Generate verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('Generated code for new user:', code);
        
        // Create new user
        console.log('Inserting new user...');
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              email: email.toLowerCase(),
              password: password,
              verification_code: code,
              verified: false
            }
          ])
          .select(); // Return inserted data for logging

        if (insertError) {
          console.error('Registration insert error:', insertError);
          throw new Error(`Failed to register: ${insertError.message}`);
        }

        console.log('User inserted successfully:', newUserData[0]);

        let emailSuccess = true;
        try {
          // Send verification email
          await sendVerificationEmail(email.toLowerCase(), code);
          console.log('Email sent successfully - auto-navigating to Verify');
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          emailSuccess = false;
          if (!BYPASS_EMAIL) {
            // Delete the user if email sending fails (original behavior)
            const { error: deleteError } = await supabase
              .from('users')
              .delete()
              .eq('email', email.toLowerCase());
            if (deleteError) console.error('Cleanup delete error:', deleteError);
            throw new Error('Failed to send verification code. Please try again.');
          } else {
            console.log('BYPASS_EMAIL: Keeping user despite email failure');
          }
        }

        // Auto-navigate to Verify (no Alert needed)
        if (emailSuccess || BYPASS_EMAIL) {
          console.log('Auto-navigating to Verify screen');
          navigation.navigate('Verify', { email: email.toLowerCase() });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.title}>
            {isLogin ? 'Login' : 'Register'}
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            editable={!loading}
          />

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <Button
                title={isLogin ? 'Login' : 'Register'}
                onPress={handleAuth}
                disabled={loading}
              />
            )}
          </View>

          <Text
            onPress={() => !loading && setIsLogin(!isLogin)}
            style={[
              styles.switchText,
              loading && styles.disabledText
            ]}
          >
            {isLogin ? 'No account? Register here' : 'Already have an account? Login'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  form: {
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 16,
    height: 40,
    justifyContent: 'center',
  },
  switchText: {
    color: '#0000ff',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
});