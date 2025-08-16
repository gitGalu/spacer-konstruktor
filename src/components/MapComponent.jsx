import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardBody, CardFooter, Image, Stack, IconButton, Box } from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineDelete } from 'react-icons/ai';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
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

const createCustomIcon = (color = '#3182ce') => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 25px;
      height: 25px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      transform: rotate(-45deg);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [25, 25],
    iconAnchor: [12, 25]
  });
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
  areas = [],
}) => {
  const getImageStatus = useMemo(() => {
    return (image) => {
      if (!image.lat || !image.lon) {
        return 'no-location';
      }
      
      // Check for duplicates based on location data
      const duplicates = images.filter(img => 
        img.key !== image.key && 
        img.lat === image.lat && 
        img.lon === image.lon
      );
      
      if (duplicates.length > 0) {
        return 'duplicate-location';
      }
      
      const hasArea = areas.some(area => {
        if (!area.layer) return false;
        try {
          const coords = area.layer.toGeoJSON().geometry;
          const point = turf.point([image.lon, image.lat]);
          return turf.booleanPointInPolygon(point, coords);
        } catch (e) {
          return false;
        }
      });
      
      return hasArea ? 'assigned' : 'unassigned';
    };
  }, [areas, images]);

  const getMarkerIcon = (status) => {
    switch (status) {
      case 'no-location':
        return createCustomIcon('#e53e3e');
      case 'unassigned':
        return createCustomIcon('#e53e3e');
      case 'duplicate-location':
        return createCustomIcon('#f56500');
      case 'assigned':
        return createCustomIcon('#38a169');
      default:
        return createCustomIcon('#3182ce');
    }
  };

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
          .map((image) => {
            const status = getImageStatus(image);
            return (
              <Marker 
                key={image.key} 
                position={[image.lat, image.lon]}
                icon={getMarkerIcon(status)}
              >
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
            );
          })}
      </MapContainer>
    </Box>
  );
};