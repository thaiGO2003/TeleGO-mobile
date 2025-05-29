import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize,
  },
  flex_spacebetween_fullwidth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  // Flexbox styles
  flex_center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex_row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',  // default
    alignItems: 'center',  // default
  },
  flex_row_center: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex_row_end: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  flex_column: {
    flexDirection: 'column',
    justifyContent: 'flex-start',  // default
    alignItems: 'center',  // default
  },
  flex_column_center: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex_column_end: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  flex_around: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  flex_between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex_evenly: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  flex_alignstart: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  flex_alignend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  flex_column_around: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  flex_column_between: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
