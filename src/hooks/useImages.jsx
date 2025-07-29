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
      console.log('File type:', file.type, 'Size:', file.size);
      console.log('User agent:', navigator.userAgent);
      console.log('WebAssembly supported:', typeof WebAssembly !== 'undefined');
      
      let exif = null;
      try {
        console.log('Attempting EXIF parsing...');
        exif = await exifr.parse(file);
        console.log('EXIF parsed successfully:', exif);
        if (!exif) {
          console.log('No EXIF data found in image, proceeding without GPS coordinates');
        }
      } catch (exifErr) {
        console.warn('EXIF parsing failed:', exifErr);
        console.error('EXIF error details:', {
          name: exifErr.name,
          message: exifErr.message,
          stack: exifErr.stack
        });
        console.log('Proceeding with image import without EXIF data');
      }

      console.log('Starting image resize...');
      try {
        const image = await resizeFile(file);
        console.log('Image resized successfully, data length:', image?.length);
        
        setImages(prev => [...prev, {
          key: counterRef.current++,
          data: image,
          lat: exif?.latitude || null,
          lon: exif?.longitude || null,
          direction: exif?.GPSImgDirection || null,
          directionRef: exif?.GPSImgDirectionRef || null
        }]);
        
        console.log('Image added to state successfully');
      } catch (resizeErr) {
        console.error('Image resize failed:', resizeErr);
        throw new Error(`Image resize failed: ${resizeErr.message}`);
      }
    } catch (err) {
      console.error('Image import failed:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
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