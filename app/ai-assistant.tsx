import { View, Text, TextInput, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Send, Bot } from 'lucide-react-native';

export default function AIAssistantScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const messages = [
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m your AI health assistant. How can I help you today?',
    },
    {
      id: 2,
      type: 'user',
      text: 'I need help understanding a patient\'s blood test results.',
    },
    {
      id: 3,
      type: 'bot',
      text: 'I\'ll help you interpret the results. Please share the specific values you\'d like to understand.',
    },
  ];

  return (
    <View style={[styles.container, isLargeScreen && styles.containerLarge]}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.type === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
              isLargeScreen && styles.messageWrapperLarge,
            ]}>
            {message.type === 'bot' && (
              <View style={styles.botIcon}>
                <Bot size={20} color="#0891b2" />
              </View>
            )}
            <View
              style={[
                styles.message,
                message.type === 'user' ? styles.userMessage : styles.botMessage,
              ]}>
              <Text style={[
                styles.messageText,
                message.type === 'user' ? styles.userMessageText : styles.botMessageText,
              ]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#64748b"
          multiline
        />
        <View style={styles.sendButton}>
          <Send size={20} color="#ffffff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerLarge: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageWrapperLarge: {
    maxWidth: '80%',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  message: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#0891b2',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
    fontFamily: 'Inter-Regular',
  },
  botMessageText: {
    color: '#0f172a',
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 12,
    paddingRight: 48,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});