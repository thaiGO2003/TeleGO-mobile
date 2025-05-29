import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');
const gf = new GiphyFetch('hKZOLjC3pTyQqbuCQa02WITnz90vCuKQ');

const GifModal = ({ isVisible, onClose, onGifSelect }) => {
  const [gifs, setGifs] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchGifs(query || 'gif');
  }, [query]);

  const fetchGifs = async (searchTerm) => {
    const { data } = await gf.search(searchTerm, { limit: 20 });
    setGifs(data);
  };

  const handleSearch = (text) => {
    setQuery(text);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Search GIFs..."
                    style={styles.searchInput}
                    value={query}
                    onChangeText={handleSearch}
                    placeholderTextColor="#aaa"
                  />
                </View>

                <FlatList
                  data={gifs}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.gifList}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onGifSelect(item)} style={styles.gifWrapper}>
                      <Image
                        source={{ uri: item.images.fixed_height.url }}
                        style={styles.gifImage}
                      />
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default GifModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.5,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    elevation: 8,
  },
  modalContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  gifList: {
    paddingBottom: 10,
  },
  gifWrapper: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  gifImage: {
    width: 140,
    height: 140,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 5,
    alignItems: 'center',
  },
  closeText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
