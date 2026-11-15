import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';

// Hooks tipados: los componentes y hooks nunca usan useDispatch ni useSelector sin tipo
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
