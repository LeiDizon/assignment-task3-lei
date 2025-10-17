import 'react-native-get-random-values';
import { Feather } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useContext, useState } from 'react';
import { Alert, Image, ScrollView,StyleSheet, Text, TextInput, View,  TouchableOpacity,} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { AuthenticationContext } from '../context/AuthenticationContext';
import * as api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export default function CreateEvent(props: StackScreenProps<any>) {
    const { navigation, route } = props;
    const { latitude, longitude } = route.params as { latitude: number; longitude: number };
    const authenticationContext = useContext(AuthenticationContext);

    const [eventName, setEventName] = useState<string>('');
    const [eventDescription, setEventDescription] = useState<string>('');
    const [volunteersNeeded, setVolunteersNeeded] = useState<string>('');
    const [eventDateTime, setEventDateTime] = useState<string>('');
    const [eventImageUrl, setEventImageUrl] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleSaveEvent = async () => {
        // Validate form
        if (!eventName.trim()) {
            Alert.alert('Error', 'Please enter an event name');
            return;
        }
        if (!eventDescription.trim()) {
            Alert.alert('Error', 'Please enter an event description');
            return;
        }
        if (!volunteersNeeded.trim() || isNaN(Number(volunteersNeeded))) {
            Alert.alert('Error', 'Please enter a valid number of volunteers needed');
            return;
        }
        if (!eventDateTime.trim()) {
            Alert.alert('Error', 'Please enter an event date and time');
            return;
        }

        setIsSaving(true);

        try {
            const newEvent = {
                id: uuidv4(),
                name: eventName.trim(),
                description: eventDescription.trim(),
                dateTime: new Date(eventDateTime).toISOString(),
                organizerId: authenticationContext?.value?.id || '',
                position: {
                    latitude,
                    longitude,
                },
                volunteersNeeded: Number(volunteersNeeded),
                volunteersIds: [],
                ...(eventImageUrl.trim() && { imageUrl: eventImageUrl.trim() }),
            };

       
            await api.createEvent(newEvent);
            
            Alert.alert('Success', 'Event created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('EventsMap'),
                },
            ]);
        } catch (error) {
            console.log('Failed to create event:', error);
            Alert.alert('Error', 'Failed to create event. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        Alert.alert('Cancel', 'Are you sure you want to cancel creating this event?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => navigation.goBack() },
        ]);
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#00A3FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add event</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                    <Feather name="x" size={24} color="#FF669D" />
                </TouchableOpacity>
            </View>

                 <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.locationInfo}>
                    <Feather name="map-pin" size={16} color="#8fa7b3" />
                    <Text style={styles.locationText}>
                        Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Event Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={eventName}
                            onChangeText={setEventName}
                            placeholder="Enter event name"
                            placeholderTextColor="#8fa7b3"
                        />
                    </View>

                   <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={eventDescription}
                            onChangeText={setEventDescription}
                            placeholder="Enter event description"
                            placeholderTextColor="#8fa7b3"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Volunteers Needed *</Text>
                        <TextInput
                            style={styles.input}
                            value={volunteersNeeded}
                            onChangeText={setVolunteersNeeded}
                            placeholder="Enter number of volunteers"
                            placeholderTextColor="#8fa7b3"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date and Time *</Text>
                        <TextInput
                            style={styles.input}
                            value={eventDateTime}
                            onChangeText={setEventDateTime}
                            placeholder="YYYY-MM-DD HH:MM (e.g., 2025-12-31 14:30)"
                            placeholderTextColor="#8fa7b3"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Image URL (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={eventImageUrl}
                            onChangeText={setEventImageUrl}
                            placeholder="Enter image URL"
                            placeholderTextColor="#8fa7b3"
                        />
                    </View>
                </View>
            </ScrollView>

           
            <View style={styles.footer}>
                <RectButton
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    enabled={!isSaving}
                >
                    <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                </RectButton>

                <RectButton
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveEvent}
                    enabled={!isSaving}
                >
                    <Feather name="check" size={20} color="#FFF" />
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                        {isSaving ? 'Saving...' : 'Save Event'}
                    </Text>
                </RectButton>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F3F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#D3E2E5',
    },
    backButton: {
        padding: 4,
        width: 40,
    },
    closeButton: {
        padding: 4,
        width: 40,
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 18,
        color: '#8fa7b3',
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F7FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    locationText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 12,
        color: '#5c8599',
        marginLeft: 8,
    },
    form: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 14,
        color: '#4D6F80',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F8FA',
        borderWidth: 1,
        borderColor: '#D3E2E5',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 16,
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#4D6F80',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#D3E2E5',
    },
    button: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#FF669D',
        marginRight: 8,
    },
    saveButton: {
        backgroundColor: '#00A3FF',
        marginLeft: 8,
    },
    buttonText: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#FF669D',
    },
    saveButtonText: {
        color: '#FFF',
    },
});