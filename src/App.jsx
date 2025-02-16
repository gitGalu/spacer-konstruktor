import React from 'react';
import {
  ChakraProvider, Box, Flex, Heading, Spacer, ButtonGroup,
  Button, Link, Tabs, TabList, Tab, TabPanels, TabPanel, useDisclosure
} from '@chakra-ui/react';
import { SmallAddIcon } from '@chakra-ui/icons';
import { AiOutlineFolderOpen, AiOutlineDownload, AiOutlineGithub } from 'react-icons/ai';
import L from 'leaflet';
import { useImages } from "./hooks/useImages";
import { useAreas } from "./hooks/useAreas";
import { useProjectMetadata } from "./hooks/useProjectMetadata";
import { Dropzone } from './components/Dropzone';
import { ImageGrid } from './components/ImageGrid';
import { MapComponent } from './components/MapComponent';
import { AreasTable } from './components/AreasTable';
import { ProjectMetadataForm } from './components/ProjectMetadataForm';
import { EditImageModal } from './components/EditImageModal';
import { exportProject } from './utils/export';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react';
import * as turf from '@turf/turf';
import exifr from 'exifr';
import { useTranslation } from 'react-i18next';

export function App() {
  const { t } = useTranslation();

  const {
    images,
    setImages,
    selectedImage,
    setSelectedImage,
    importImage,
    deleteImage
  } = useImages();

  const {
    areas,
    setAreas,
    areaNames,
    setAreaNames,
    setAreaName,
    getImagesCount,
    getUnassignedImagesCount,
    deleteArea,
    doAreasOverlap,
    mapRef,
    onCreated,
    onEdited
  } = useAreas();

  const {
    title,
    setTitle,
    author,
    setAuthor,
    version,
    setVersion,
    description,
    setDescription,
    license,
    setLicense,
    downloadEnabled,
    DEFAULT_LICENSE
  } = useProjectMetadata();

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedLat, setSelectedLat] = React.useState(0);
  const [selectedLon, setSelectedLon] = React.useState(0);
  const selectedMarkerRef = React.useRef(null);
  const inputFile = React.useRef(null);

  const [distanceUtil, setDistanceUtil] = React.useState([]);

  const maxDistance = (coords) => {
    let maxDistance = 0;

    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const from = turf.point([coords[i].lon, coords[i].lat]);
        const to = turf.point([coords[j].lon, coords[j].lat]);
        const distance = turf.distance(from, to, { units: 'meters' });
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }
    }

    return maxDistance.toFixed(2) + ' m';
  };

  const addImageToCompare = async (file) => {
    try {
      const exif = await exifr.parse(file);
      if (!exif) {
        throw new Error('Cannot parse EXIF data!');
      }
      if (exif.latitude === undefined || exif.longitude === undefined) {
        throw new Error('No location data!');
      }
      setDistanceUtil(prev => [...prev, {
        lat: exif.latitude,
        lon: exif.longitude,
        heading: null
      }]);
    } catch (err) {
      console.error('Error processing image:', err);
    }
  };

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setSelectedLat(image.lat || 0);
    setSelectedLon(image.lon || 0);
    onEditOpen();
  };

  const handleSaveImageLocation = () => {
    if (selectedImage) {
      setImages(prev => prev.map(img =>
        img.key === selectedImage.key
          ? { ...img, lat: parseFloat(selectedLat), lon: parseFloat(selectedLon) }
          : img
      ));
    }
    onEditClose();
  };

  const eventHandlers = {
    dragend() {
      const marker = selectedMarkerRef.current;
      if (marker) {
        const latLng = marker.getLatLng();
        setSelectedLat(latLng.lat);
        setSelectedLon(latLng.lng);
      }
    },
  };

  const isValidCoordinate = (lat, lon) => {
    return !isNaN(lat) && !isNaN(lon) &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180;
  };

  const handleNewProject = () => {
    if (window.confirm(t('confirmNewProject'))) {
      setImages([]);
      setSelectedImage(null);

      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            mapRef.current.removeLayer(layer);
          }
        });
      }
      setAreas([]);
      setAreaNames({});

      setTitle('');
      setAuthor('');
      setVersion('');
      setDescription('');
      setLicense(DEFAULT_LICENSE);

      onEditClose();
    }
  };

  const handleImportProject = () => {
    inputFile.current.click();
  };

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

        if (mapRef.current) {
          mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Polygon) {
              mapRef.current.removeLayer(layer);
            }
          });
        }

        if (data.areas && Array.isArray(data.areas)) {
          data.areas.forEach(area => {
            if (area.coords && area.name) {
              const layer = L.geoJSON(area.coords).getLayers()[0];
              layer.options.polygonId = area.id;
              layer.addTo(mapRef.current);
              setAreas(prev => [...prev, { id: area.id, layer }]);
              setAreaName(area.id, area.name);
            }
          });
        }
      } catch (e) {
        console.error('Import failed:', e);
      }
    };

    reader.readAsText(file);
  };

  const handleTabChange = (index) => {
    if (index === 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 250);
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Tabs
          variant="enclosed"
          onChange={handleTabChange}
          colorScheme="gray"
        >
          <Box className="header-container">
            <Box maxW="var(--content-max-width)" mx="auto" px={6}>
              <Flex h="72px" alignItems="center" justifyContent="space-between">
                <Heading
                  size="lg"
                  color="gray.800"
                  letterSpacing="tight"
                >
                  Spacer-Konstruktor
                </Heading>
                <ButtonGroup spacing={3}>
                  <Link
                    href="https://github.com/gitGalu/spacer-konstruktor"
                    isExternal
                  >
                    <Button
                      variant="ghost"
                      size="md"
                      leftIcon={<AiOutlineGithub />}
                    >
                      GitHub
                    </Button>
                  </Link>
                  <Button
                    leftIcon={<SmallAddIcon />}
                    size="md"
                    variant="ghost"
                    onClick={handleNewProject}
                  >
                    {t('newProject')}
                  </Button>
                  <Button
                    leftIcon={<AiOutlineFolderOpen />}
                    size="md"
                    variant="ghost"
                    onClick={handleImportProject}
                  >
                    {t('importProject')}
                  </Button>
                  <input
                    type='file'
                    id='file'
                    ref={inputFile}
                    style={{ display: 'none' }}
                    accept=".json,.project"
                    onChange={handleFileChange}
                  />
                  <Button
                    leftIcon={<AiOutlineDownload />}
                    size="md"
                    variant="solid"
                    onClick={() => exportProject(
                      title,
                      version,
                      author,
                      description,
                      license,
                      images,
                      areas,
                      areaNames,
                      false
                    )}
                  >
                    {t('downloadProject')}
                  </Button>
                </ButtonGroup>
              </Flex>

              <Box pt={2}>
                <TabList>
                  {[t('photos'), t('areas'), t('export'), t('utils')].map((tab) => (
                    <Tab
                      key={tab}
                      bg="gray.100"
                      borderTopRadius="lg"
                      borderBottom="none"
                      mr={1}
                      px={8}
                      py={3}
                      _selected={{
                        bg: 'gray.200',
                        borderColor: 'gray.400',
                        fontWeight: '500'
                      }}
                      _hover={{
                        bg: 'gray.200'
                      }}
                      transition="all 0.2s"
                    >
                      {tab}
                    </Tab>
                  ))}
                </TabList>
              </Box>
            </Box>
          </Box>

          <Box maxW="var(--content-max-width)" mx="auto" px={6} py={8}>
            <TabPanels>
              <TabPanel p={0}>
                <Box>
                  <Dropzone multiple={true} onFileAccepted={importImage} />
                  <Box pt={6}>
                    <ImageGrid
                      images={images}
                      onEditImage={handleEditImage}
                      onDeleteImage={deleteImage}
                    />
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel p={0}>
                <Flex gap={8} align="start">
                  <AreasTable
                    areas={areas}
                    areaNames={areaNames}
                    setAreaName={setAreaName}
                    getImagesCount={getImagesCount}
                    deleteArea={deleteArea}
                    doAreasOverlap={doAreasOverlap}
                    unassignedCount={getUnassignedImagesCount(images)}
                    images={images}
                  />
                  <MapComponent
                    images={images}
                    onEditImage={handleEditImage}
                    onDeleteImage={deleteImage}
                    mapRef={mapRef}
                    onCreated={onCreated}
                    onEdited={onEdited}
                  />
                </Flex>
              </TabPanel>

              <TabPanel p={0}>
                <Box
                  maxW="3xl"
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  p={8}
                >
                  <ProjectMetadataForm
                    title={title}
                    setTitle={setTitle}
                    author={author}
                    setAuthor={setAuthor}
                    version={version}
                    setVersion={setVersion}
                    description={description}
                    setDescription={setDescription}
                    license={license}
                    setLicense={setLicense}
                    onDownload={() => exportProject(
                      title,
                      version,
                      author,
                      description,
                      license,
                      images,
                      areas,
                      areaNames,
                      true
                    )}
                    downloadEnabled={downloadEnabled}
                  />
                </Box>
              </TabPanel>
              <TabPanel p={0}>
                <Box>
                  <Heading as='h6' size='sm' paddingBottom='16px'>
                    {t('compareImages')}
                  </Heading>
                  <Dropzone multiple={true} onFileAccepted={addImageToCompare} />
                  <Box mt={6}>
                    {distanceUtil.length > 0 ? (
                      <TableContainer>
                        <Table variant='simple'>
                          <Thead>
                            <Tr>
                              <Th>{t('imageCount')}</Th>
                              <Th>{t('maxDistance')}</Th>
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
                    ) : (
                      <Text>{t('compareDescription')}</Text>
                    )}
                  </Box>
                  <Button marginTop='16px' onClick={() => setDistanceUtil([])}>{t('resetComparisonButton')}</Button>
                </Box>
              </TabPanel>
            </TabPanels>
          </Box>
        </Tabs>

        <EditImageModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          selectedImage={selectedImage}
          selectedLat={selectedLat}
          selectedLon={selectedLon}
          onLatChange={setSelectedLat}
          onLonChange={setSelectedLon}
          onSave={handleSaveImageLocation}
          markerRef={selectedMarkerRef}
          eventHandlers={eventHandlers}
          isValidCoordinate={isValidCoordinate}
        />
      </Box>
    </ChakraProvider>
  );
}