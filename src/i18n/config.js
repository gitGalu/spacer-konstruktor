import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          // Header
          appName: 'Spacer-Konstruktor',
          newProject: 'New Project',
          importProject: 'Import Project',
          downloadProject: 'Download Project',
          
          // Tabs
          photos: 'Photos',
          areas: 'Areas',
          export: 'Export',
          utils: 'Utils',
          
          // Dropzone
          dropzoneText: 'Drag & drop images here, or click to select files',
          dropzoneActive: 'Drop the images here ...',
          supportedFormats: 'Supported formats: JPEG, JPG, PNG',
          
          // Areas
          areaName: 'Area name',
          photosCount: 'Photos count',
          notAssigned: 'Not assigned or location info missing',
          areasOverlap: 'Areas must not overlap!',
          adjustAreas: 'Please adjust the areas so they\'ll not overlap.',
          
          // Export form
          scenarioTitle: 'Scenario Title',
          author: 'Author',
          version: 'Scenario version',
          description: 'Description',
          license: 'License',
          downloadScenarioButton: 'Download scenario file',
          
          // Modals
          editPhotoLocation: 'Edit Photo Location',
          latitude: 'Latitude',
          longitude: 'Longitude',
          save: 'Save',
          cancel: 'Cancel',
          
          // Confirmations
          confirmNewProject: 'Do you want to create a new project? All unsaved changes will be lost.',
          
          // Messages
          importFailed: 'Import failed',
          fileLoadError: 'The file cannot be loaded.',

          // Tools
          compareImages: 'Compare images',
          compareDescription: 'You can add multiple images and calculate max distance between its locations.',
          resetComparisonButton: 'Reset comparison'
        }
      },
      pl: {
        translation: {
          // Header
          appName: 'Spacer-Konstruktor',
          newProject: 'Nowy Projekt',
          importProject: 'Importuj Projekt',
          downloadProject: 'Pobierz Projekt',
          
          // Tabs
          photos: 'Zdjęcia',
          areas: 'Obszary',
          export: 'Eksport',
          utils: 'Narzędzia',
          
          // Dropzone
          dropzoneText: 'Przeciągnij i upuść zdjęcia lub kliknij, aby wybrać pliki',
          dropzoneActive: 'Upuść zdjęcia tutaj ...',
          supportedFormats: 'Obsługiwane formaty: JPEG, JPG, PNG',
          
          // Areas
          areaName: 'Nazwa obszaru',
          photosCount: 'Liczba zdjęć',
          notAssigned: 'Nieprzypisane lub brak informacji o lokalizacji',
          areasOverlap: 'Obszary nie mogą się nakładać!',
          adjustAreas: 'Dostosuj obszary tak, aby się nie nakładały.',
          
          // Export form
          scenarioTitle: 'Tytuł scenariusza',
          author: 'Autor scenariusza',
          version: 'Wersja scenariusza',
          description: 'Opis scenariusza',
          license: 'Licencja',
          downloadScenarioButton: 'Pobierz plik scenariusza',
          
          // Modals
          editPhotoLocation: 'Edytuj lokalizację ze zdjęcia',
          latitude: 'Szerokość geogr.',
          longitude: 'Długość geogr.',
          save: 'Zapisz',
          cancel: 'Anuluj',
          
          // Confirmations
          confirmNewProject: 'Czy chcesz utworzyć nowy projekt? Wszystkie niezapisane zmiany zostaną utracone.',
          
          // Messages
          importFailed: 'Import nie powiódł się',
          fileLoadError: 'Nie można wczytać pliku.',
          exportErrorNoLocationData: 'Image does not have location data assigned',
          exportErrorNoAreaAssigned: 'Image does not have area assigned',
          exportError: '',

          // Tools
          compareImages: 'Porównaj zdjęcia',
          compareDescription: 'Możesz dodać wiele zdjęć i zobaczyć maksymalną odległość między zapisanymi w nich lokalizacjami.',
          resetComparisonButton: 'Zresetuj porównanie'

        }
      }
    }
  });

export default i18n;