import * as React from 'react'
import './App.css';
import exifr from 'exifr'
import Resizer from "react-image-file-resizer";
import { MasonryInfiniteGrid } from "@egjs/react-infinitegrid";
import * as turf from '@turf/turf';
import Dropzone from './Dropzone.js';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { GeomanControls } from 'react-leaflet-geoman-v2';
import { ChakraProvider, Alert, AlertIcon, AlertTitle, AlertDescription, Box, Button, Heading, Link, Stack, Tab, Tabs, TabList, TabPanel, TabPanels, Table, Thead, Tbody, Tr, Th, Td, TableContainer, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react'
import { Card, CardBody, CardFooter, Flex, Spacer, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, IconButton, ButtonGroup, Image, FormControl, FormLabel, FormErrorMessage, FormHelperText, Input, Textarea, Select, useToast, useDisclosure } from '@chakra-ui/react';
import { AddIcon, SmallAddIcon, DownloadIcon, DeleteIcon } from '@chakra-ui/icons';
import { AiOutlineDownload, AiOutlineEye, AiOutlineDelete, AiOutlineEdit, AiOutlinePlus, AiOutlineFolderOpen } from 'react-icons/ai';
import { IoIosCreate } from 'react-icons/io';
import sanitize from 'sanitize-filename';
import L from "leaflet";

function App() {
  const DEFAULT_LICENSE = "Creative Commons CC-BY-SA [ https://creativecommons.org/licenses/by-sa/3.0/ ]";
  const latitudeRegex = /^-?([1-8]?[0-9](\.\d+)?|90(\.0+)?)$/;
  const longitudeRegex = /^-?((1[0-7][0-9]|[1-9]?[0-9])(\.\d+)?|180(\.0+)?)$/;
  const coordinatePattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png'
  });

  const [polygons, setPolygons] = React.useState([]);
  let polygonId = 0;
  const counterRef = React.useRef(0);

  const [images, setImages] = React.useState([]);
  const [areas, setAreas] = React.useState([]);
  const [areaNames, setAreaNames] = React.useState({});
  const [author, setAuthor] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [license, setLicense] = React.useState(DEFAULT_LICENSE);
  const [distanceUtil, setDistanceUtil] = React.useState([]);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedLat, setSelectedLat] = React.useState(0);
  const [selectedLon, setSelectedLon] = React.useState(0);
  const [selectedDirection, setSelectedDirection] = React.useState(null);
  const [selectedDirectionRef, setSelectedDirectionRef] = React.useState(null);
  const selectedMarkerRef = React.useRef(null);
  const idCounter = React.useRef(0);
  const areasRef = React.useRef(areas);
  areasRef.current = areas;
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNewProjectOpen, onOpen: onNewProjectOpen, onClose: onNewProjectClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportOpenClose } = useDisclosure();

  const inputFile = React.useRef(null);
  const cancelRef = React.useRef();
  const cancelExportRef = React.useRef();
  const mapRef = React.useRef(null);
  const toast = useToast();

  const setAreaName = (key, value) => {
    setAreaNames((prevMap) => ({
      ...prevMap,
      [key]: value
    }));
  }

  React.useEffect(() => {
    if (selectedImage == null) return;
    setSelectedLat(selectedImage.lat);
    setSelectedLon(selectedImage.lon);
    setSelectedDirection(selectedImage.direction);
    setSelectedDirectionRef(selectedImage.directionRef);
  }, [selectedImage]);

  const handleMapCreated = (map) => {
    mapRef.current = map;
  };

  const onCreated = (e) => {
    const id = idCounter.current++;
    e.layer.options.polygonId = id;
    let area = { id: id, layer: e.layer }
    console.log('created laya');
    console.log(area);
    setAreas(prev => [...prev, area]);
    setAreaName(id, '');
  };

  const onEdited = (e) => {
    console.log('onEdited');
    const id = e.layer.options.polygonId;
    const geojson = e.layer.toGeoJSON();

    //REMOVE layer

    setAreas(areasRef.current.map(area =>
      area.id == id
        ? { ...area, geometry: geojson }
        : area
    ));
  }

  const deleteArea = (layer) => {
    mapRef.current.eachLayer(function (lay) {
      if (layer.layer._leaflet_id == lay._leaflet_id) {
        mapRef.current.removeLayer(lay);
      }
    });
    setAreas(prev => prev.filter(area => area.id !== layer.id));
  }

  const downloadEnabled = () => {
    if (author.trim().length == 0 || title.trim().length == 0 || version.trim().length == 0) {
      return false;
    }
    return true;
  }

  const invalidateMap = () => {
    setTimeout(function () {
      mapRef.current.invalidateSize();
    }, 10);
  }

  const resizeFile = (file) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(file, 1280, 1280, "JPEG", 70, 0, (uri) => { resolve(uri); }, "base64");
    });

  const addImageToCompare = async (file) => {
    try {
      const exif = await exifr.parse(file);
      if (exif == null || exif == undefined) {
        throw new Error('Cannot parse EXIF data!');
      } else {
        if (exif.latitude == undefined || exif.longitude == undefined) {
          throw new Error('Cannot parse EXIF data!');
        }
        setDistanceUtil(prev => [...prev, { lat: exif.latitude, lon: exif.longitude, heading: null }]);
      }
    } catch (err) {
    }
  }

  const renderComparison = () => {
    if (distanceUtil.length > 0) {
      return (
        <TableContainer>
          <Table variant='simple'>
            <Thead>
              <Tr>
                <Th>Image count</Th>
                <Th>Max distance</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>{distanceUtil.length}</Td>
                <Td>{maxDistance(distanceUtil)}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      )
    } else {
      return (
        <p>You can add multiple images and calculate max distance between its locations.</p>
      )
    }
  }

  const importImage = async (file) => {
    try {
      const exif = await exifr.parse(file);

      if (exif == null || exif == undefined) {
        throw new Error('Cannot parse EXIF data!');
      } else {
        if (exif.latitude == undefined || exif.longitude == undefined) {
          exif.longitude = null;
          exif.latitude = null;
        }
        const image = await resizeFile(file);
        await setImages(prev => [...prev, { key: counterRef.current++, data: image, lat: exif.latitude, lon: exif.longitude, direction: exif.GPSImgDirection, directionRef: exif.GPSImgDirectionRef }]);
      }
    } catch (err) {
      toast({
        title: 'The file cannot be loaded.',
        description: file.name,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleImportProject = () => {
    inputFile.current.click();
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setImages(data.images);
        setTitle(data.scenario_title);
        setAuthor(data.scenario_author);
        setVersion(data.scenario_version);
        setDescription(data.scenario_description);
        setLicense(data.scenario_license);
        for (const area of data.areas) {
          let geoJsonLayer = L.geoJSON(area.coords);
          let restoredArea = { id: area.id, layer: geoJsonLayer }
          console.log('restored laya');
          console.log(restoredArea);
          setAreas(prev => [...prev, restoredArea]);
        }
        setAreaNames(data.areas.reduce((acc, area) => {
          return { ...acc, [area.id]: area.name };
        }, {}));
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  const newProject = () => {
    setImages([]);
    setSelectedImage([null]);
    selectedLat(0);
    selectedLon(0);
    selectedDirection(null);
    selectedDirectionRef(null);
    setAreas([]);
    setAreaNames({});
    setDistanceUtil([]);
    setTitle("");
    setAuthor("");
    setVersion("");
    setDescription("");
    setLicense(DEFAULT_LICENSE);
    onNewProjectClose();
  }

  const getImagesCount = (area) => {
    console.log(area);

    let count = 0;
    for (const image of images) {
      console.log('-');
      console.log('area layer');
      console.log(area.layer);
      console.log('-');

      if (image.lon == null || image.lat == null) continue;
      const pointToCheck = turf.point([image.lon, image.lat]);
      const coords = area.layer.toGeoJSON().geometry;
      console.log('---AREA.LAYER.TOGEO=');
      console.log(area.layer.toGeoJSON());
      console.log(coords);
      if (turf.booleanPointInPolygon(pointToCheck, coords)) count++;
    }
    return count;
  }

  const getUnassignedImagesCount = () => {
    let count = 0;
    for (const image of images) {
      let inside = false;
      if (image.lat == null || image.lon == null) {
        count++;
        continue;
      }
      const pointToCheck = turf.point([image.lon, image.lat]);
      for (const area of areas) {
        const coords = area.layer.toGeoJSON().geometry;
        if (turf.booleanPointInPolygon(pointToCheck, coords)) {
          inside = true;
          break;
        }
      }
      if (!inside) {
        count++;
      }
    }
    return count;
  }

  const doAreasOverlap = (geoJsonArray) => {
    return false;
    for (let i = 0; i < geoJsonArray.length; i++) {
      for (let j = i + 1; j < geoJsonArray.length; j++) {
        const overlap = turf.booleanOverlap(geoJsonArray[i], geoJsonArray[j]);
        const contains = turf.booleanContains(geoJsonArray[i], geoJsonArray[j]);
        if (overlap || contains) { return true; }
      }
    }
    return false;
  };

  const isInBounds = (lat, lon, area) => {
    console.log('isinbounds');
    const pointToCheck = turf.point([lon, lat]);
    if (turf.booleanPointInPolygon(pointToCheck, area)) { console.log('ttt'); return true; }
    return false;
  }

  const getAreaName = (lat, lon, strict) => {
    if (lat == null || lon == null) {
      if (strict) { throw new Error("Image does not have location data assigned"); }
      return <>&shy;</>;
    }
    for (const area of areas) {
      let geometry = area.layer.toGeoJSON().geometry;
      if (isInBounds(lat, lon, geometry)) { return areaNames[area.id]; }
    }
    if (strict) { throw new Error("Image does not have Area assigned") }
    return <>&shy;</>;
  }

  const checkAreaNames = () => {
    console.log('name');
    const areaNamesValues = Object.values(areaNames);
    console.log(areaNamesValues);
    console.log(areaNames);
    // Check for null or empty values
    if (areaNamesValues.some(name => name === null || name === '')) {
      console.log('name');
      console.log(areaNamesValues);
      return false;
    }
    // Check for non-unique values
    const uniqueValues = [...new Set(areaNamesValues)];
    if (uniqueValues.length !== areaNamesValues.length) { return false; }
    return true;
  }

  const handleDownload = (strict) => {
    let counter = 1;

    try {
      if (strict) {
        if (!checkAreaNames()) throw new Error("Area names must be unique and not empty.");
      }

      let exportObj = {
        manifest_version: '0',
        scenario_title: title,
        scenario_version: version,
        scenario_author: author,
        scenario_description: description,
        scenario_license: license,
        images: images.map(obj => ({ ...obj, id: counter++, area: getAreaName(obj.lat, obj.lon, strict) })),
        // areas: areas.map(obj => ({ ...obj, name: areaNames[obj.id] }))
        areas: areas.map(obj => ({ id: obj.id, coords: obj.layer.toGeoJSON(), name: areaNames[obj.id] }))
      }
      let exportName = sanitize("spacer-" + title + "-" + version);
      let extensionName = ".json";
      if (!strict) {
        extensionName = ".project";
      }
      let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
      let downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", exportName + extensionName);
      document.body.appendChild(downloadAnchorNode); // firefox fix
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      return false;
    }
  }

  function maxDistance(coords) {
    let maxDistance = 0;

    // Iterate over all pairs of coordinates
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        // Create turf Points
        const from = turf.point([coords[i].lon, coords[i].lat]);
        const to = turf.point([coords[j].lon, coords[j].lat]);
        // Calculate distance between them in meters
        const distance = turf.distance(from, to, { units: 'meters' });
        // Update maxDistance if current distance is larger
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }
    }

    return maxDistance.toFixed(2) + ' m';
  }

  function UpdateMap({ center }) {
    const map = useMap();
    map.setView(center);
    return null;
  }

  const eventHandlers = {
    dragend() {
      const marker = selectedMarkerRef.current;
      if (marker != null) {
        setSelectedLat(marker.getLatLng().lat);
        setSelectedLon(marker.getLatLng().lng);
      }
    },
  }

  const isValidCoordinate = (lat, lng) => {
    return coordinatePattern.test(lat + ',' + lng);
  }

  const saveSelected = () => {
    selectedImage.lat = selectedLat;
    selectedImage.lon = selectedLon;

    onEditClose();
  }

  const onEachFeature = (feature, layer) => {
    layer.pm.enable();
  }

  const GeoJsonLayer = ({ geojsonData }) => {
    const map = useMap();
    React.useEffect(() => {
      if (map) {
        // Load geojson
        let geoJsonLayer = L.geoJSON(geojsonData).addTo(map);

        map.pm.setGlobalOptions({
          snappable: false,
        });
        // Enable Geoman with options
        map.pm.addControls({
          position: 'topleft',
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          drawCircle: false,
          drawPolygon: true,
          dragMode: true,
          cutPolygon: false,
          drawText: false,
          //
          editMode: true,
          rotateMode: false,
          dragMode: false,
          removalMode: false
        });

        // geoJsonLayer.eachLayer((layer) => {
        // layer.pm.enable();
        // });

        // map.on('pm:create', (e) => {
        //   e.layer.pm.enable();
        // });

        map.on('pm:create', onCreated);
        map.on('pm:rotateend', onEdited);
        // map.on('pm:remove', onDeleted);
      }

      return () => {
        if (map) {
          map.off('pm:create', onCreated);
          map.off('pm:rotateend', onEdited);
          // map.off('pm:remove', onDeleted);
          // map.pm.disable();
        }
      };
    }, [map]);

    return null;
  };

  return (
    <ChakraProvider>
      <Box minHeight="93vh" display="flex" flexDirection="column">
        <Box flex="1">
          <Flex minWidth='max-content' alignItems='center' gap='2'>
            <Heading size={'md'} mb={4}>Spacer-Konstruktor</Heading>
            <Spacer />
            <ButtonGroup mb={4} gap='3' style={{ paddingRight: '16px' }}>
              <Link href="https://github.com/gitGalu/spacer-konstruktor" isExternal>
                <Button variant="outline" size='sm'>GitHub</Button>
              </Link>
              <Button leftIcon={<SmallAddIcon />} size='sm' onClick={onNewProjectOpen}>New Project</Button>
              <Button leftIcon={<AiOutlineFolderOpen />} size='sm' onClick={handleImportProject}>
                Import Project
              </Button>
              <input type='file' id='file' ref={inputFile} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
              <Button leftIcon={<DownloadIcon />} size='sm' onClick={() => (handleDownload(false))}>
                Download Project
              </Button>
            </ButtonGroup>
          </Flex>
          <Tabs variant='enclosed' onChange={(index) => { invalidateMap() }}>
            <TabList>
              <Tab>Photos</Tab>
              <Tab>Areas</Tab>
              <Tab>Export</Tab>
              <Tab>Utils</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Dropzone multiple="true" onFileAccepted={importImage} />
                <div style={{ paddingBottom: '16px' }}></div>
                <MasonryInfiniteGrid
                  className="masonry-container"
                  gap={10}
                  column={5}
                  align={'stretch'}
                  useResizeObserver={true}
                  observeChildren={true}
                  loading={<div className="loading">LOADING</div>}
                  onRequestAppend={(e) => {
                  }}
                >
                  {images.map((image) => (
                    <Card
                      padding="0px"
                      key={image.key}
                    >
                      <CardBody>
                        <Image
                          src={image.data}
                          borderRadius='base' />
                      </CardBody>
                      <CardFooter paddingTop="0px" justify='right'>
                        <Stack direction='row' spacing={4} align='center'>
                          <IconButton variant={(image.lat == null || image.lon == null) ? 'solid' : 'outline'} colorScheme={(image.lat == null || image.lon == null) ? 'red' : 'gray'} fontSize='16px' icon={<AiOutlineEye />} onClick={() => { setSelectedImage(image); onEditOpen(); }}></IconButton>
                          <IconButton variant='outline' fontSize='16px' icon={<AiOutlineDelete />} onClick={() => { setSelectedImage(image); onOpen(); }}></IconButton>
                        </Stack>
                      </CardFooter>
                    </Card>
                  ))}
                </MasonryInfiniteGrid>

                <Modal
                  size={'lg'}
                  isOpen={isEditOpen}
                  onClose={onEditClose}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Photo Data</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                      <Stack direction='row' spacing={4} align='baseline'>
                        <FormControl>
                          <FormLabel>Latitude</FormLabel>
                          <Input type='number' value={selectedLat} onChange={(event) => { if (latitudeRegex.test(event.target.value)) { setSelectedLat(event.target.value) } }} />
                        </FormControl>
                        <FormControl mt={4}>
                          <FormLabel>Longitude</FormLabel>
                          <Input type='number' value={selectedLon} onChange={(event) => { if (longitudeRegex.test(event.target.value)) { setSelectedLon(event.target.value) } }} />
                        </FormControl>
                      </Stack>
                      {(selectedImage == null) || (selectedImage.lat == null || selectedImage.lon == null) ? '' :
                        <MapContainer attributionControl={false} center={(selectedImage == null || selectedImage.lat == null || selectedImage.lon == null) ? [54.517, 18.542] : [selectedImage.lat, selectedImage.lon]} zoom={19} style={{ height: "25vh", 'marginTop': '16px' }}>
                          <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            draggable={true}
                            eventHandlers={eventHandlers}
                            position={[selectedLat, selectedLon]}
                            ref={selectedMarkerRef}>
                          </Marker>
                        </MapContainer>
                      }
                    </ModalBody>
                    <ModalFooter>
                      <Button onClick={() => { setDistanceUtil(prev => [...prev, { lat: selectedImage.lat, lon: selectedImage.lon, direction: selectedImage.heading, directionRef: 'T' }]); }} mr={3}>Add to Utils</Button>
                      <Button colorScheme='blue' mr={3} onClick={() => { saveSelected(); }} disabled={!isValidCoordinate(selectedLat, selectedLon)}>
                        Save
                      </Button>
                      <Button onClick={onEditClose} mr={3}>Cancel</Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                <AlertDialog
                  isOpen={isOpen}
                  leastDestructiveRef={cancelRef}
                  onClose={onClose}
                >
                  <AlertDialogOverlay>
                    <AlertDialogContent>
                      <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        Delete image
                      </AlertDialogHeader>
                      <AlertDialogBody>
                        Are you sure?
                      </AlertDialogBody>
                      <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                          Cancel
                        </Button>
                        <Button colorScheme='red' ml={3} onClick={() => {
                          let index = images.indexOf(selectedImage);
                          if (index !== -1) {
                            images.splice(index, 1);
                          }
                          onClose()
                        }} >
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogOverlay>
                </AlertDialog>
              </TabPanel>
              <TabPanel>
                <SimpleGrid columns={2}>
                  <TableContainer mr={6}>
                    {doAreasOverlap(
                      areas.map(function (area) { return area.layer.toGeoJSON().geometry; })) ?
                      (<Alert borderRadius='lg' status='error' variant='subtle' marginBottom='32px' >
                        <AlertIcon />
                        <AlertTitle>Areas must not overlap!</AlertTitle>
                        <AlertDescription>Please adjust the areas so they'll not overlap.</AlertDescription>
                      </Alert>)
                      :
                      <Table variant='simple' >
                        <Thead>
                          <Tr>
                            <Th>Area name</Th>
                            <Th isNumeric>Photos count</Th>
                            <Th ></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {areas.map((area) =>
                            <Tr>
                              <Td>
                                <Input defaultValue={areaNames[area.id]} onChange={(event) => setAreaName(area.id, event.target.value)} />
                              </Td>
                              <Td isNumeric>
                               {getImagesCount(area)} 
                              </Td>
                              <Td>
                                <IconButton icon={<DeleteIcon />} variant='outline' onClick={(event) => deleteArea(area)} />
                              </Td>
                            </Tr>
                          )}
                          <Tr>

                            <Td>Not assigned or location info missing</Td>
                            {(() => {
                              const unassigned = getUnassignedImagesCount();
                              return (
                                <Td isNumeric color={unassigned > 0 ? 'red.500' : 'black'}>{unassigned}</Td>
                              )
                            })()}
                          </Tr>
                        </Tbody>
                      </Table>
                    }
                  </TableContainer>
                  <MapContainer
                    attributionControl={false}
                    center={[54.504, 18.532]}
                    zoom={13}
                    style={{ height: '400px' }}
                    ref={mapRef}
                    whenCreated={handleMapCreated}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <GeoJsonLayer geojsonData={areas} />

                    {images.filter((image) => (image.lat != null && image.lon != null)).map((image) => (
                      <Marker position={[image.lat, image.lon]} edit={false}>
                        <Popup>
                          <Card
                            padding="0px">
                            <CardBody>
                              <Image
                                src={image.data}
                                borderRadius='base' />
                            </CardBody>
                            <CardFooter paddingTop="0px" justify='right'>
                              <Stack direction='row' spacing={4} align='center'>
                                <IconButton variant={(image.lat == null || image.lon == null) ? 'solid' : 'outline'} colorScheme={(image.lat == null || image.lon == null) ? 'red' : 'gray'} fontSize='16px' icon={<AiOutlineEye />} onClick={() => { setSelectedImage(image); onEditOpen(); }}></IconButton>
                                <IconButton variant='outline' fontSize='16px' icon={<AiOutlineDelete />} onClick={() => { setSelectedImage(image); onOpen(); }}></IconButton>
                              </Stack>
                            </CardFooter>
                          </Card>
                        </Popup>
                      </Marker>
                    ))
                    }
                    {/* <GeomanHandler /> */}
                  </MapContainer>
                </SimpleGrid>
              </TabPanel>
              <TabPanel>
                <FormControl>
                  <FormLabel>Scenario Title</FormLabel>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </FormControl>
                <FormControl mt={6}>
                  <FormLabel>Author</FormLabel>
                  <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
                </FormControl>
                <FormControl mt={6}>
                  <FormLabel>Version</FormLabel>
                  {/* <NumberInput> */}
                  <Input value={version} onChange={(event) => setVersion(event.target.value)} />
                  {/* <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper> */}
                  {/* </NumberInput> */}
                </FormControl>
                <FormControl mt={6}>
                  <FormLabel>Description</FormLabel>
                  <Textarea placeholder='' value={description} onChange={(event) => setDescription(event.target.value)} />
                </FormControl>
                <FormControl mt={6}>
                  <FormLabel>License</FormLabel>
                  <Input value={license} onChange={(event) => setLicense(event.target.value)} />
                </FormControl>
                <FormControl>
                  <Stack direction='row' spacing={4} align='end'>
                    <Button leftIcon={<AiOutlineDownload />} size='lg' colorScheme='blue' mt='24px' isDisabled={!downloadEnabled()} onClick={() => handleDownload(true)}>
                      Download Scenario File
                    </Button>
                  </Stack>
                </FormControl>
              </TabPanel>
              <TabPanel>
                <Heading as='h6' size='sm' paddingBottom='16px'>
                  Compare images
                </Heading>
                <Dropzone multiple="true" onFileAccepted={addImageToCompare} />
                <br />
                {
                  renderComparison()
                }
                <Button marginTop='16px' onClick={() => setDistanceUtil([])}>Reset comparison</Button>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <AlertDialog isOpen={isNewProjectOpen} leastDestructiveRef={cancelRef} onClose={onNewProjectClose}>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize='lg' fontWeight='bold'>New Project</AlertDialogHeader>
                <AlertDialogBody>Do you want to create a new project and lose any unsaved changes?</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onNewProjectClose}>Cancel</Button>
                  <Button colorScheme='blue' ml={3} onClick={newProject}>Confirm</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
          <AlertDialog isOpen={isExportOpen} leastDestructiveRef={cancelExportRef} onClose={onExportOpenClose}>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize='lg' fontWeight='bold'>Xport</AlertDialogHeader>
                <AlertDialogBody>Do you want to create a new project and lose any unsaved changes?</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelExportRef} onClick={onExportOpenClose}>Cancel</Button>
                  <Button colorScheme='blue' ml={3} onClick={() => { }}>Confirm</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </Box>
      </Box>
    </ChakraProvider >
  );
}

export default App;