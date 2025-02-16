import { useState } from 'react';
import { DEFAULT_LICENSE } from '../constants';

export const useProjectMetadata = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState(DEFAULT_LICENSE);

  const downloadEnabled = () => {
    return title.trim().length > 0 && 
           author.trim().length > 0 && 
           version.trim().length > 0;
  };

  const resetMetadata = () => {
    setTitle("");
    setAuthor("");
    setVersion("");
    setDescription("");
    setLicense(DEFAULT_LICENSE);
  };

  return {
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
    resetMetadata
  };
};