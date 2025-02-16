export const DEFAULT_LICENSE = "Creative Commons CC-BY-SA [ https://creativecommons.org/licenses/by-sa/3.0/ ]";
export const DEFAULT_CENTER = [54.504, 18.532];
export const DEFAULT_ZOOM = 13;

export const REGEX = {
  latitude: /^-?([1-8]?[0-9](\.\d+)?|90(\.0+)?)$/,
  longitude: /^-?((1[0-7][0-9]|[1-9]?[0-9])(\.\d+)?|180(\.0+)?)$/,
  coordinate: /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
};

import { useState, useRef } from 'react';
import exifr from 'exifr';
import Resizer from "react-image-file-resizer";
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const resizeFile = (file) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      1280,
      1280,
      "JPEG",
      70,
      0,
      (uri) => { resolve(uri); },
      "base64"
    );
  });

export const useImages = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const counterRef = useRef(0);
  const toast = useToast();

  const importImage = async (file) => {
    try {
      const exif = await exifr.parse(file);
      if (!exif) {
        throw new Error('Cannot parse EXIF data!');
      }

      const image = await resizeFile(file);
      setImages(prev => [...prev, {
        key: counterRef.current++,
        data: image,
        lat: exif.latitude || null,
        lon: exif.longitude || null,
        direction: exif.GPSImgDirection || null,
        directionRef: exif.GPSImgDirectionRef || null
      }]);
    } catch (err) {
      toast({
        title: t('fileLoadError'),
        description: file.name,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const deleteImage = (imageToDelete) => {
    setImages(prev => prev.filter(img => img.key !== imageToDelete.key));
    if (selectedImage?.key === imageToDelete.key) {
      setSelectedImage(null);
    }
  };

  return {
    images,
    setImages,
    selectedImage,
    setSelectedImage,
    importImage,
    deleteImage,
    counterRef
  };
};