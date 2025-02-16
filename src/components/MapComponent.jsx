import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardBody, CardFooter, Image, Stack, IconButton, Box } from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineDelete } from 'react-icons/ai';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const POLYGON_STYLES = {
  color: '#2B6CB0',
  fillColor: '#2B6CB0',
  fillOpacity: 0.2,
  weight: 3,
  opacity: 0.8
};

const MapInitializer = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    const initializeMap = () => {
      map.invalidateSize();
    };

    initializeMap();

    const timeouts = [100, 500, 1000].map(delay => 
      setTimeout(initializeMap, delay)
    );

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [map]);

  return null;
};

const MapControls = ({ onCreated, onEdited }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    map.pm.setGlobalOptions({
      layerGroup: drawnItems,
      pathOptions: POLYGON_STYLES,
      snappable: false,
    });

    map.pm.addControls({
      position: 'topleft',
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawMarker: false,
      drawPolygon: true,
      editMode: true,
      removalMode: true,
      cutPolygon: false,
      drawText: false,
      rotateMode: false
    });

    const handleCreate = (e) => {
      const layer = e.layer;
      layer.setStyle(POLYGON_STYLES);
      drawnItems.addLayer(layer);
      onCreated(e);
    };

    map.on('pm:create', handleCreate);
    map.on('pm:edit', onEdited);

    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:edit', onEdited);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
};

export const MapComponent = ({
  images,
  onEditImage,
  onDeleteImage,
  mapRef,
  onCreated,
  onEdited,
}) => {
  return (
    <Box flex="1" height="600px" position="relative" className="map-container">
      <MapContainer
        center={[54.504, 18.532]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={(map) => {
          if (mapRef) {
            mapRef.current = map;
            setTimeout(() => map.invalidateSize(), 100);
          }
        }}
      >
        <MapInitializer />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapControls onCreated={onCreated} onEdited={onEdited} />
        
        {images
          .filter((image) => image.lat != null && image.lon != null)
          .map((image) => (
            <Marker key={image.key} position={[image.lat, image.lon]}>
              <Popup>
                <Card padding="0px">
                  <CardBody>
                    <Image src={image.data} borderRadius='base' />
                  </CardBody>
                  <CardFooter paddingTop="0px" justify='right'>
                    <Stack direction='row' spacing={4} align='center'>
                      <IconButton
                        variant='outline'
                        fontSize='16px'
                        icon={<AiOutlineEye />}
                        onClick={() => onEditImage(image)}
                      />
                      <IconButton
                        variant='outline'
                        fontSize='16px'
                        icon={<AiOutlineDelete />}
                        onClick={() => onDeleteImage(image)}
                      />
                    </Stack>
                  </CardFooter>
                </Card>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </Box>
  );
};