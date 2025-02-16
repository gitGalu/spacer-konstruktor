import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Box
} from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

export const EditImageModal = ({
  isOpen,
  onClose,
  selectedImage,
  selectedLat,
  selectedLon,
  onLatChange,
  onLonChange,
  onSave,
  markerRef,
  eventHandlers,
  isValidCoordinate
}) => {
  const { t } = useTranslation();

  if (!selectedImage) return null;

  const center = [
    selectedLat || 54.504,
    selectedLon || 18.532
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent
        maxH="calc(100vh - 40px)"
        my="20px"
      >
        <ModalHeader>{t('editPhotoLocation')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={4}>
            <Stack direction="row" spacing={4}>
              <FormControl>
                <FormLabel>{t('latitude')}</FormLabel>
                <Input
                  type="number"
                  value={selectedLat}
                  onChange={(e) => onLatChange(e.target.value)}
                  step="any"
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('longitude')}</FormLabel>
                <Input
                  type="number"
                  value={selectedLon}
                  onChange={(e) => onLonChange(e.target.value)}
                  step="any"
                />
              </FormControl>
            </Stack>

            <Box h="300px">
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={center}
                  draggable={true}
                  eventHandlers={eventHandlers}
                  ref={markerRef}
                />
              </MapContainer>
            </Box>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={onSave}
            isDisabled={!isValidCoordinate(selectedLat, selectedLon)}
          >
            {t('save')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};