import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface DiscordInviteData {
  invite_url: string;
  code: string;
}

interface DiscordInviteState {
  inviteUrl: string | null;
  isLoading: boolean;
  error: string | null;
  hasRequested: boolean;
}

export const useDiscordInvite = () => {
  const [state, setState] = useState<DiscordInviteState>({
    inviteUrl: null,
    isLoading: false,
    error: null,
    hasRequested: false
  });

  const getDiscordInvite = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Запрос Discord инвайта...');
      
      const { data, error } = await supabase.functions.invoke('get-discord-invite', {
        body: {}
      });

      if (error) {
        console.error('Ошибка Edge Function:', error);
        throw new Error(error.message || 'Не удалось получить Discord инвайт');
      }

      // Check if Edge Function returned a business logic error (HTTP 200 but with error message)
      if (data?.error) {
        console.log('Получена ошибка бизнес-логики:', data.error);
        throw new Error(data.error);
      }

      // Edge Function возвращает данные в свойстве data
      const inviteData: DiscordInviteData | null = data?.data || data;
      
      if (!inviteData || !inviteData.invite_url) {
        throw new Error('Нет доступных инвайтов');
      }

      console.log('Discord инвайт получен успешно:', inviteData.code);
      
      setState(prev => ({
        ...prev,
        inviteUrl: inviteData.invite_url,
        isLoading: false,
        hasRequested: true
      }));

    } catch (err: any) {
      console.error('Ошибка получения Discord инвайта:', err);
      
      let errorMessage = 'Не удалось получить Discord инвайт';
      
      if (err.message.includes('пуле')) {
        errorMessage = 'В данный момент нет доступных инвайтов. Пожалуйста, свяжитесь с администратором.';
      } else if (err.message.includes('configuration')) {
        errorMessage = 'Проблема с конфигурацией сервера. Пожалуйста, попробуйте позже.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        hasRequested: true
      }));
    }
  };

  const resetState = () => {
    setState({
      inviteUrl: null,
      isLoading: false,
      error: null,
      hasRequested: false
    });
  };

  const openDiscordInvite = () => {
    if (state.inviteUrl) {
      window.open(state.inviteUrl, '_blank');
    }
  };

  return {
    ...state,
    getDiscordInvite,
    resetState,
    openDiscordInvite
  };
};