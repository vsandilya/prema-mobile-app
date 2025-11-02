# Messaging UI Documentation

## Overview
The messaging UI provides a complete chat experience for the dating app, including conversation lists and real-time messaging functionality.

## Features

### ✅ **ConversationsScreen**
- **Conversation List**: Shows all conversations with other users
- **Last Message Preview**: Displays the most recent message content
- **Timestamp Display**: Shows when the last message was sent
- **Unread Count Badges**: Visual indicators for unread messages
- **User Avatars**: Initials-based avatars for each user
- **Pull-to-Refresh**: Refresh conversations list
- **Empty State**: Friendly message when no conversations exist
- **Navigation**: Tap to open chat with specific user

### ✅ **ChatScreen**
- **Real-time Messaging**: Send and receive messages instantly
- **Chat Bubbles**: Modern chat bubble UI with different colors for sent/received
- **Auto-scroll**: Automatically scrolls to bottom for new messages
- **Message Timestamps**: Shows when messages were sent
- **Auto-refresh**: Polls for new messages every 3 seconds
- **Pull-to-Refresh**: Manual refresh capability
- **Read Receipts**: Automatically marks messages as read
- **Keyboard Handling**: Proper keyboard avoidance
- **Loading States**: Shows loading indicators during operations
- **Error Handling**: User-friendly error messages

### ✅ **Navigation Integration**
- **Stack Navigation**: Properly integrated with React Navigation
- **Back Navigation**: Intuitive back button functionality
- **Screen Parameters**: Passes user data between screens

### ✅ **API Integration**
- **Authentication**: All API calls include JWT tokens
- **Error Handling**: Comprehensive error handling for API failures
- **Loading States**: Visual feedback during API operations

## Screen Structure

### ConversationsScreen
```
SafeAreaView
├── Header (Back button, Title, Placeholder)
├── Empty State (when no conversations)
└── FlatList
    └── ConversationItem
        ├── Avatar (with unread badge)
        └── Content
            ├── Header (Name, Timestamp)
            └── Last Message
```

### ChatScreen
```
SafeAreaView
├── Header (Back button, User name, Placeholder)
└── KeyboardAvoidingView
    ├── FlatList (Messages)
    └── Input Container
        ├── TextInput
        └── Send Button
```

## API Methods Added to AuthContext

### `sendMessage(receiverId: number, content: string): Promise<Message>`
Sends a message to another user.

### `getConversations(): Promise<ConversationSummary[]>`
Retrieves all conversations for the current user.

### `getMessagesWithUser(userId: number): Promise<Message[]>`
Gets all messages between current user and specified user.

### `markMessageAsRead(messageId: number): Promise<Message>`
Marks a specific message as read.

## Styling Features

### Modern Chat Design
- **iOS-style bubbles**: Rounded corners with proper spacing
- **Color coding**: Blue for sent messages, gray for received
- **Typography**: Clear, readable text with proper sizing
- **Spacing**: Consistent padding and margins throughout

### Responsive Layout
- **Keyboard avoidance**: Proper handling on both iOS and Android
- **Safe areas**: Respects device safe areas and notches
- **Flexible sizing**: Adapts to different screen sizes

### Visual Feedback
- **Loading indicators**: Activity indicators during operations
- **Unread badges**: Red badges with unread message counts
- **Button states**: Disabled states for buttons when appropriate
- **Empty states**: Friendly messages when no data is available

## User Experience Features

### Real-time Updates
- **Auto-refresh**: Messages refresh every 3 seconds
- **Immediate feedback**: Sent messages appear instantly
- **Read receipts**: Messages are automatically marked as read

### Intuitive Navigation
- **Back buttons**: Consistent back navigation
- **Screen titles**: Clear indication of current screen
- **Parameter passing**: User data flows smoothly between screens

### Error Handling
- **User-friendly messages**: Clear error descriptions
- **Retry mechanisms**: Pull-to-refresh for failed operations
- **Graceful degradation**: App continues to work even with API errors

## Integration Points

### ProfileScreen
- **Messages button**: Green button to navigate to conversations
- **Consistent styling**: Matches the existing app design

### Navigation Stack
- **Proper routing**: All screens properly registered in navigation
- **Parameter handling**: User IDs and names passed between screens
- **Back navigation**: Proper navigation flow

## Performance Considerations

### Efficient Rendering
- **FlatList optimization**: Proper key extraction and rendering
- **Memory management**: Efficient state updates
- **Polling optimization**: Reasonable refresh intervals

### Network Efficiency
- **Error handling**: Prevents unnecessary API calls
- **Loading states**: Prevents duplicate requests
- **Caching**: Local state management for better UX

## Usage Flow

1. **User opens ProfileScreen**
2. **Taps "💬 Messages" button**
3. **ConversationsScreen loads** showing all conversations
4. **User taps on a conversation**
5. **ChatScreen opens** with message history
6. **User can send/receive messages** in real-time
7. **Auto-refresh keeps messages updated**
8. **Back navigation returns to conversations**

## Error Scenarios Handled

- **Network failures**: Graceful error messages
- **Authentication errors**: Proper token handling
- **Empty states**: Friendly messages when no data
- **Loading failures**: Retry mechanisms available
- **Invalid user data**: Proper validation and error handling

The messaging UI provides a complete, modern chat experience that integrates seamlessly with the existing dating app functionality.
