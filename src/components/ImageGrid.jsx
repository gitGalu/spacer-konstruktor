import { MasonryInfiniteGrid } from "@egjs/react-infinitegrid";
import { Card, CardBody, CardFooter, Image, Stack, IconButton } from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineDelete } from 'react-icons/ai';

export const ImageGrid = ({ images, onEditImage, onDeleteImage }) => {
  return (
    <MasonryInfiniteGrid
      className="masonry-container"
      gap={10}
      column={5}
      align="stretch"
      useResizeObserver={true}
      observeChildren={true}
    >
      {images.map((image) => (
        <Card padding="0px" key={image.key}>
          <CardBody>
            <Image src={image.data} borderRadius='base' />
          </CardBody>
          <CardFooter paddingTop="0px" justify='right'>
            <Stack direction='row' spacing={4} align='center'>
              <IconButton 
                variant={(image.lat == null || image.lon == null) ? 'solid' : 'outline'}
                colorScheme={(image.lat == null || image.lon == null) ? 'red' : 'gray'}
                fontSize='16px'
                icon={<AiOutlineEye />}
                onClick={() => onEditImage(image)}
              />
              <IconButton
                variant='outline'
                fontSize='16px'
                icon={<AiOutlineDelete />}
                onClick={() => onDeleteImage(image)}
              />
            </Stack>
          </CardFooter>
        </Card>
      ))}
    </MasonryInfiniteGrid>
  );
};