import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useContext, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import customMapStyle from '../../map-style.json';
import * as MapSettings from '../constants/MapSettings';
import { AuthenticationContext } from '../context/AuthenticationContext';
import mapMarkerImg from '../images/map-marker.png';

import { useEffect,useState } from 'react';

// Import the Spinner component from the 'react-native-loading-spinner-overlay' library
import Spinner from 'react-native-loading-spinner-overlay';

// Import the api object from the '../services/api' module
// The api object is used to make API requests to the server
import * as api from '../services/api';

// Import the getFromCache function from the '../services/caching' module
// The getFromCache function is used to retrieve data from the cache
import { getFromCache } from '../services/caching';

// The getFromCache function takes a key as an argument and returns a promise
// that resolves to the cached data associated with the key
// If the data is not found in the cache, the promise is rejected with an error
// The function is used to implement a caching strategy for API requests
// It checks if the requested data is already cached, and if so, returns the cached data
// If not, it makes the API request and caches the response before returning it

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

export default function EventsMap(props: StackScreenProps<any>) {
    const { navigation } = props;
    const authenticationContext = useContext(AuthenticationContext);
    const mapViewRef = useRef<MapView>(null);
    
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            // Try to fetch from network first, fallback to cache if network fails
            const data = await api.getEvents();
            console.log('Events loaded from API:', data);
            setEvents(data);
        } catch (error) {
            console.log('Failed to load from API, trying cache...');
            try {
                // If API fails, try to load from cache
                const cachedEvents = await getFromCache<Event[]>('events');
                console.log('Events loaded from cache:', cachedEvents);
                setEvents(cachedEvents);
            } catch (cacheError) {
                console.log('No cached events available:', cacheError);
                setEvents([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Fits the map to show all markers when events are loaded
     * This code is called when the events state changes
     * It will fit the map to show all the markers of the events, with an animation
     */
    useEffect(() => {
        // If there are events and the map is ready
        if (events.length > 0 && mapViewRef.current) {
            // Get the coordinates of all the events
            const coordinates = events.map(({ position }) => ({
                latitude: position.latitude,
                longitude: position.longitude,
            }));

            // Fit the map to show all the markers, with an animation
            // The edge padding is set to 64px on top, 16px on right, 104px on bottom, and 16px on left
            // This is to ensure that the markers are not cut off by the edge of the map
            // The animated parameter is set to true, to animate the map movement
            // The map is fitted to the coordinates of all the events
            // This will move the map to show all the events
            // The animation will make the map movement smooth and visually appealing
            mapViewRef.current.fitToCoordinates(
                coordinates,
                { edgePadding: MapSettings.EDGE_PADDING, animated: true }
            );
        }
    }, [events]);

    /**
     * Handles the navigation to the create event screen
     * This function will be called when the user wants to create a new event
     * It will navigate to the create event screen
     */

    const handleNavigateToEventDetails = (eventId: string) => {
        // TODO: Navigate to event details screen
        console.log('Navigate to event:', eventId);
    };

    /**
     * Handles the logout action
     * This function will be called when the user wants to log out
     * It will remove the user info and access token from the AsyncStorage
     * and then navigate back to the login screen
     */
    const handleLogout = async () => {
        // Remove user info and access token from AsyncStorage
        try {
            await AsyncStorage.multiRemove(['userInfo', 'accessToken']);
            // Set the authentication context value to undefined
            // This will trigger the authentication context to reset
            authenticationContext?.setValue(undefined);
            // Navigate back to the login screen
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
            >
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
            </MapView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{events.length} event(s) found</Text>
                <RectButton
                    style={[styles.smallButton, { backgroundColor: '#00A3FF' }]}
                    onPress={handleNavigateToCreateEvent}
                >
                    <Feather name="plus" size={20} color="#FFF" />
                </RectButton>
            </View>
            <RectButton
                style={[styles.logoutButton, styles.smallButton, { backgroundColor: '#4D6F80' }]}
                onPress={handleLogout}
            >
                <Feather name="log-out" size={20} color="#FFF" />
            </RectButton>

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