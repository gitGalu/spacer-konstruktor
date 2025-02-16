import sanitize from 'sanitize-filename';
import * as turf from '@turf/turf';

export const exportProject = (
  title,
  version,
  author,
  description,
  license,
  images,
  areas,
  areaNames,
  strict = false
) => {
  try {
    const getAreaName = (lat, lon, strict) => {
      if (lat == null || lon == null) {
        if (strict) throw new Error("Image does not have location data assigned");
        return null;
      }
      for (const area of areas) {
        const geometry = area.layer.toGeoJSON().geometry;
        const pointToCheck = turf.point([lon, lat]);
        if (turf.booleanPointInPolygon(pointToCheck, geometry)) {
          return areaNames[area.id];
        }
      }
      if (strict) throw new Error("Image does not have Area assigned");
      return null;
    };

    const exportObj = {
      manifest_version: '0',
      scenario_title: title,
      scenario_version: version,
      scenario_author: author,
      scenario_description: description,
      scenario_license: license,
      images: images.map((img, index) => ({
        area: getAreaName(img.lat, img.lon, strict),
        ...img,
        id: index + 1
      })),
      areas: areas.map(obj => ({
        id: obj.id,
        coords: obj.layer.toGeoJSON(),
        name: areaNames[obj.id]
      }))
    };

    const filename = sanitize(`spacer-${title}-${version}`);
    const extension = strict ? '.json' : '.project';
    downloadFile(exportObj, `${filename}${extension}`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    alert(`An error occurred during export: ${error.message}`);
    return false;
  }
};

const downloadFile = (data, filename) => {
  const dataStr = "data:text/json;charset=utf-8," + 
                 encodeURIComponent(JSON.stringify(data));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
