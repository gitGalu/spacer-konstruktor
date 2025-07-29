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
  const { t } = useTranslation();

  const importImage = async (file) => {
    try {
      console.log('Starting image import for:', file.name);
      
      let exif = null;
      try {
        exif = await exifr.parse(file);
        console.log('EXIF parsed successfully:', exif);
      } catch (exifErr) {
        console.warn('EXIF parsing failed:', exifErr);
      }

      console.log('Starting image resize...');
      const image = await resizeFile(file);
      console.log('Image resized successfully');
      
      setImages(prev => [...prev, {
        key: counterRef.current++,
        data: image,
        lat: exif?.latitude || null,
        lon: exif?.longitude || null,
        direction: exif?.GPSImgDirection || null,
        directionRef: exif?.GPSImgDirectionRef || null
      }]);
      
      console.log('Image added to state successfully');
    } catch (err) {
      console.error('Image import failed:', err);
      toast({
        title: t('fileLoadError'),
        description: `${file.name}: ${err.message}`,
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