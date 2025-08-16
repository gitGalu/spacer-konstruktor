import { useState, useRef } from 'react';
import * as turf from '@turf/turf';

export const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [areaNames, setAreaNames] = useState({});
  const [focusedAreaId, setFocusedAreaId] = useState(null);
  const idCounter = useRef(0);
  const mapRef = useRef(null);

  const setAreaName = (key, value) => {
    setAreaNames(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getImagesCount = (area, images) => {
    return images.reduce((count, image) => {
      if (!image.lat || !image.lon) return count;
      const pointToCheck = turf.point([image.lon, image.lat]);
      const coords = area.layer.toGeoJSON().geometry;
      return count + (turf.booleanPointInPolygon(pointToCheck, coords) ? 1 : 0);
    }, 0);
  };

  const getUnassignedImagesCount = (images) => {
    return images.reduce((count, image) => {
      if (!image.lat || !image.lon) return count + 1;
      const isAssigned = areas.some(area => {
        const coords = area.layer.toGeoJSON().geometry;
        return turf.booleanPointInPolygon(turf.point([image.lon, image.lat]), coords);
      });
      return count + (isAssigned ? 0 : 1);
    }, 0);
  };

  const deleteArea = (layer) => {
    if (!mapRef.current) return;
    
    if (layer.layer) {
      mapRef.current.removeLayer(layer.layer);
    }
    setAreas(prev => prev.filter(area => area.id !== layer.id));
  };

  const onCreated = (e) => {
    const id = idCounter.current++;
    e.layer.options.polygonId = id;
    e.layer.setStyle({
      color: '#2B6CB0',
      fillColor: '#2B6CB0',
      fillOpacity: 0.2,
      weight: 3,
      opacity: 0.8
    });
    setAreas(prev => [...prev, { id, layer: e.layer }]);
    setAreaName(id, '');
  };

  const onEdited = (e) => {
    const id = e.layer.options.polygonId;
    const geojson = e.layer.toGeoJSON();
    setAreas(prev => prev.map(area =>
      area.id === id ? { ...area, geometry: geojson } : area
    ));
  };

  const checkAreaNames = () => {
    const areaNamesValues = Object.values(areaNames);
    if (areaNamesValues.some(name => !name)) return false;
    const uniqueValues = [...new Set(areaNamesValues)];
    return uniqueValues.length === areaNamesValues.length;
  };

  const doAreasOverlap = () => {
    const geoJsonArray = areas.map(area => area.layer.toGeoJSON().geometry);
    for (let i = 0; i < geoJsonArray.length; i++) {
      for (let j = i + 1; j < geoJsonArray.length; j++) {
        if (turf.booleanOverlap(geoJsonArray[i], geoJsonArray[j]) ||
            turf.booleanContains(geoJsonArray[i], geoJsonArray[j])) {
          return true;
        }
      }
    }
    return false;
  };

  return {
    areas,
    setAreas,
    areaNames,
    setAreaNames,
    setAreaName,
    getImagesCount,
    getUnassignedImagesCount,
    deleteArea,
    checkAreaNames,
    doAreasOverlap,
    onCreated,
    onEdited,
    mapRef,
    focusedAreaId,
    setFocusedAreaId
  };
};