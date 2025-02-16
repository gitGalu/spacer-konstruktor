import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Center, Icon, Text, VStack } from '@chakra-ui/react';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';

export const Dropzone = ({ onFileAccepted }) => {
  const { t } = useTranslation();
  
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => onFileAccepted(file));
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    multiple: true,
    onDrop
  });

  const activeBg = 'blue.50';
  const borderColor = isDragActive ? 'blue.500' : 'blue.300';

  return (
    <Center
      {...getRootProps()}
      p={10}
      cursor="pointer"
      bg={isDragActive ? activeBg : 'white'}
      _hover={{ bg: activeBg }}
      transition="all 0.2s ease"
      borderRadius="md"
      border="2px dashed"
      borderColor={borderColor}
    >
      <input {...getInputProps()} />
      <VStack spacing={3}>
        <Icon 
          as={AiOutlineCloudUpload} 
          w={10} 
          h={10} 
          color="blue.500"
          transition="transform 0.2s ease"
          _hover={{ transform: 'scale(1.1)' }}
        />
        <Text color="gray.700" align="center" fontWeight="medium">
          {isDragActive ? t('dropzoneActive') : t('dropzoneText')}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {t('supportedFormats')}
        </Text>
      </VStack>
    </Center>
  );
};