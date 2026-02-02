import { invoke } from '@tauri-apps/api/core';

// Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail_path: string | null;
  folder_path: string;
  created_at: string;
  updated_at: string;
  cloud_id: string | null;
  last_synced_at: string | null;
  sync_enabled: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name: string;
  description?: string;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

// Project commands
export const listProjects = () => invoke<Project[]>('list_projects');
export const getProject = (id: string) => invoke<Project | null>('get_project', { id });
export const createProject = (input: CreateProjectInput) => invoke<Project>('create_project', { input });
export const updateProject = (id: string, input: UpdateProjectInput) => invoke<void>('update_project', { id, input });
export const deleteProject = (id: string) => invoke<void>('delete_project', { id });

// File commands
export const getAppDataPath = () => invoke<string>('get_app_data_path');
export const getDocumentsPath = () => invoke<string>('get_documents_path');
export const ensureDirectory = (path: string) => invoke<void>('ensure_directory', { path });
export const readFile = (path: string) => invoke<number[]>('read_file', { path });
export const writeFile = (path: string, contents: number[]) => invoke<void>('write_file', { path, contents });
export const copyFile = (source: string, destination: string) => invoke<void>('copy_file', { source, destination });
export const deleteFile = (path: string) => invoke<void>('delete_file', { path });
export const listDirectory = (path: string) => invoke<FileEntry[]>('list_directory', { path });

// Settings commands
export const getSetting = (key: string) => invoke<string | null>('get_setting', { key });
export const setSetting = (key: string, value: string) => invoke<void>('set_setting', { key, value });
export const getAllSettings = () => invoke<{ key: string; value: string }[]>('get_all_settings');
