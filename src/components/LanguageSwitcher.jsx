import { Button, ButtonGroup } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <ButtonGroup size="sm" isAttached variant="outline">
      <Button
        onClick={() => i18n.changeLanguage('en')}
        bg={i18n.language === 'en' ? 'gray.100' : 'white'}
        borderTopRadius="md"
        px={3}
        _hover={{
          bg: i18n.language === 'en' ? 'gray.100' : 'gray.50'
        }}
      >
        EN
      </Button>
      <Button
        onClick={() => i18n.changeLanguage('pl')}
        bg={i18n.language === 'pl' ? 'gray.100' : 'white'}
        borderTopRadius="md"
        px={3}
        _hover={{
          bg: i18n.language === 'pl' ? 'gray.100' : 'gray.50'
        }}
      >
        PL
      </Button>
    </ButtonGroup>
  );
};