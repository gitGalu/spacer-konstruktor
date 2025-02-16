export type Image = {
    key: number;
    data: string;
    lat: number | null;
    lon: number | null;
    direction: number | null;
    directionRef: string | null;
  };
  
  export type Area = {
    id: number;
    layer: any; // Leaflet
    geometry?: any; // GeoJSON
  };
  
  export type ProjectMetadata = {
    title: string;
    author: string;
    version: string;
    description: string;
    license: string;
  };