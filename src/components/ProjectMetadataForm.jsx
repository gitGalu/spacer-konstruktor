import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Stack
} from '@chakra-ui/react';
import { AiOutlineDownload } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';

export const ProjectMetadataForm = ({
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
  onDownload,
  downloadEnabled
}) => {
  const { t } = useTranslation();

  return (
    <>
      <FormControl>
        <FormLabel>{t('scenarioTitle')}</FormLabel>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>

      <FormControl mt={6}>
        <FormLabel>{t('author')}</FormLabel>
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </FormControl>

      <FormControl mt={6}>
        <FormLabel>{t('version')}</FormLabel>
        <Input value={version} onChange={(e) => setVersion(e.target.value)} />
      </FormControl>

      <FormControl mt={6}>
        <FormLabel>{t('description')}</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormControl>

      <FormControl mt={6}>
        <FormLabel>{t('license')}</FormLabel>
        <Input value={license} onChange={(e) => setLicense(e.target.value)} />
      </FormControl>

      <FormControl>
        <Stack direction='row' spacing={4} align='end'>
          <Button
            leftIcon={<AiOutlineDownload />}
            size='lg'
            colorScheme='blue'
            mt='24px'
            isDisabled={!downloadEnabled()}
            onClick={onDownload}
          >
            {t('downloadScenarioButton')}
          </Button>
        </Stack>
      </FormControl>
    </>
  );
};