import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  TableContainer,
  Box
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

export const AreasTable = ({
  areas,
  areaNames,
  setAreaName,
  getImagesCount,
  deleteArea,
  doAreasOverlap,
  unassignedCount,
  images,
  focusedAreaId,
  setFocusedAreaId
}) => {
  const { t } = useTranslation();

  return (
    <Box flex="1" maxW="50%" mr={6}>
      {doAreasOverlap() ? (
        <Alert status='error' variant='subtle' mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>{t('areasOverlap')}</AlertTitle>
            <AlertDescription>
             {t('adjustAreas')}
            </AlertDescription>
          </Box>
        </Alert>
      ) : null}

      <TableContainer>
        <Table variant='simple'>
          <Thead>
            <Tr>
              <Th>{t('areaName')}</Th>
              <Th isNumeric>{t('photosCount')}</Th>
              <Th width="80px"></Th>
            </Tr>
          </Thead>
          <Tbody>
            {areas.map((area) => (
              <Tr key={area.id}>
                <Td>
                  <Input
                    value={areaNames[area.id] || ''}
                    onChange={(e) => setAreaName(area.id, e.target.value)}
                    onFocus={() => setFocusedAreaId(area.id)}
                    onBlur={() => setFocusedAreaId(null)}
                    size="sm"
                  />
                </Td>
                <Td isNumeric>
                  {getImagesCount(area, images)}
                </Td>
                <Td>
                  <IconButton
                    icon={<DeleteIcon />}
                    variant='outline'
                    size="sm"
                    colorScheme="red"
                    onClick={() => deleteArea(area)}
                    aria-label="Delete area"
                  />
                </Td>
              </Tr>
            ))}
            <Tr>
              <Td>{t('notAssigned')}</Td>
              <Td isNumeric color={unassignedCount > 0 ? 'red.500' : 'black'}>
                {unassignedCount}
              </Td>
              <Td />
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};