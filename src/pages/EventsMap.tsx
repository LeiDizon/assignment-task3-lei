import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useContext, useRef, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import customMapStyle from '../../map-style.json';
import * as MapSettings from '../constants/MapSettings';
import { AuthenticationContext } from '../context/AuthenticationContext';
import mapMarkerImg from '../images/map-marker.png';
import Spinner from 'react-native-loading-spinner-overlay';
import * as api from '../services/api';
import { getFromCache } from '../services/caching';

interface Event {
    id: string;
    name: string;
    dateTime: string;
    description: string;
    organizerId: string;
    position: {
        latitude: number;
        longitude: number;
    };
    volunteersNeeded: number;
    volunteersIds: string[];
    imageUrl?: string;
}

interface NewEventLocation {
    latitude: number;
    longitude: number;
}

export default function EventsMap(props: StackScreenProps<any>) {
    const { navigation } = props;
    const authenticationContext = useContext(AuthenticationContext);
    const mapViewRef = useRef<MapView>(null);
    
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
    const [newEventLocation, setNewEventLocation] = useState<NewEventLocation | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const data = await api.getEvents();
            console.log('Events loaded from API:', data);
            
            const now = new Date();
            const upcomingEvents = data.filter((event: Event) => {
                const eventDate = new Date(event.dateTime);
                return eventDate > now;
            });
            
            console.log(`Filtered ${upcomingEvents.length} future events out of ${data.length} total events`);
            setEvents(upcomingEvents);
        } catch (error) {
            console.log('Failed to load from API, trying cache...');
            try {
                const cachedEvents = await getFromCache<Event[]>('events');
                console.log('Events loaded from cache:', cachedEvents);
                
                const now = new Date();
                const upcomingEvents = cachedEvents.filter((event: Event) => {
                    const eventDate = new Date(event.dateTime);
                    return eventDate > now;
                });
                
                console.log(`Filtered ${upcomingEvents.length} upcoming events from cache`);
                setEvents(upcomingEvents);
            } catch (cacheError) {
                console.log('No cached events available:', cacheError);
                setEvents([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (events.length > 0 && mapViewRef.current && !isCreatingEvent) {
            const coordinates = events.map(({ position }) => ({
                latitude: position.latitude,
                longitude: position.longitude,
            }));

            mapViewRef.current.fitToCoordinates(
                coordinates,
                { edgePadding: MapSettings.EDGE_PADDING, animated: true }
            );
        }
    }, [events, isCreatingEvent]);

    const handleNavigateToCreateEvent = () => {
        setIsCreatingEvent(true);
        setNewEventLocation(null);
    };

    const handleCancelLocationSelection = () => {
        setIsCreatingEvent(false);
        setNewEventLocation(null);
    };

    const handleMapPress = (event: MapPressEvent) => {
        if (isCreatingEvent && !newEventLocation) {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            setNewEventLocation({ latitude, longitude });
            console.log('Location selected:', latitude, longitude);
        }
    };

    const handleLocationConfirmed = () => {
        if (newEventLocation) {
            navigation.navigate('CreateEvent', {
                latitude: newEventLocation.latitude,
                longitude: newEventLocation.longitude,
            });
            setIsCreatingEvent(false);
            setNewEventLocation(null);
        }
    };

    const handleNavigateToEventDetails = (eventId: string) => {
        console.log('Navigate to event:', eventId);
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['userInfo', 'accessToken']);
            authenticationContext?.setValue(undefined);
            navigation.navigate('Login');
        } catch (error) {
            console.log('Failed to log out:', error);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef}
                provider={PROVIDER_GOOGLE}
                initialRegion={MapSettings.DEFAULT_REGION}
                style={styles.mapStyle}
                customMapStyle={customMapStyle}
                showsMyLocationButton={false}
                showsUserLocation={true}
                rotateEnabled={false}
                toolbarEnabled={false}
                moveOnMarkerPress={false}
                mapPadding={MapSettings.EDGE_PADDING}
                onPress={handleMapPress}
            >
                {/* Existing event markers */}
                {events.map((event) => {
                    return (
                        <Marker
                            key={event.id}
                            coordinate={{
                                latitude: event.position.latitude,
                                longitude: event.position.longitude,
                            }}
                            onPress={() => handleNavigateToEventDetails(event.id)}
                        >
                            <Image resizeMode="contain" style={{ width: 48, height: 54 }} source={mapMarkerImg} />
                        </Marker>
                    );
                })}
                
                {/* New event location marker */}
                {newEventLocation && (
                    <Marker coordinate={newEventLocation}>
                        <Image resizeMode="contain" style={{ width: 48, height: 54 }} source={mapMarkerImg} />
                    </Marker>
                )}
            </MapView>

            {/* Header bar - Shows during event creation */}
            {isCreatingEvent && (
                <View style={styles.topMenuContainer}>
                    <View style={styles.menuHeader}>
                        <TouchableOpacity onPress={handleCancelLocationSelection} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#00A3FF" />
                        </TouchableOpacity>
                        <Text style={styles.menuHeaderTitle}>Add event</Text>
                        <TouchableOpacity onPress={handleCancelLocationSelection} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#FF669D" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}


            {/* Location confirmation button */}
            {isCreatingEvent && newEventLocation && (
                <View style={styles.locationConfirmContainer}>
                    <RectButton style={styles.nextButton} onPress={handleLocationConfirmed}>
                        <Text style={styles.nextButtonText}>Next</Text>
                    </RectButton>
                </View>
            )}

            {/* Footer with event count and add button */}
            {!isCreatingEvent && (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{events.length} event(s) found</Text>
                    <RectButton
                        style={[styles.smallButton, { backgroundColor: '#00A3FF' }]}
                        onPress={handleNavigateToCreateEvent}
                    >
                        <Feather name="plus" size={20} color="#FFF" />
                    </RectButton>
                </View>
            )}

            {/* Logout button */}
            <RectButton
                style={[styles.logoutButton, styles.smallButton, { backgroundColor: '#4D6F80' }]}
                onPress={handleLogout}
            >
                <Feather name="log-out" size={20} color="#FFF" />
            </RectButton>

            {/* Loading spinner */}
            <Spinner
                visible={isLoading}
                textContent={'Loading events...'}
                overlayColor="#031A62BF"
                textStyle={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    mapStyle: {
        ...StyleSheet.absoluteFillObject,
    },
    logoutButton: {
        position: 'absolute',
        top: 70,
        right: 24,
        elevation: 3,
    },
    topMenuContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
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
    menuHeaderTitle: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 18,
        color: '#8fa7b3',
        flex: 1,
        textAlign: 'center',
    },
    instructionBanner: {
        position: 'absolute',
        top: 140,
        left: 24,
        right: 24,
        backgroundColor: '#00A3FF',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    instructionText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
        textAlign: 'center',
    },
    locationConfirmContainer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
    },
    nextButton: {
        backgroundColor: '#00A3FF',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
    },
    footer: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 40,
        backgroundColor: '#FFF',
        borderRadius: 16,
        height: 56,
        paddingLeft: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 3,
    },
    footerText: {
        fontFamily: 'Nunito_700Bold',
        color: '#8fa7b3',
    },
    smallButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});