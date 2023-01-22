import { Platform, StatusBar, Dimensions } from 'react-native';
import { theme } from 'galio-framework';

 const StatusHeight = StatusBar.currentHeight;
 const HeaderHeight = (theme.SIZES.BASE * 3.5 + (StatusHeight || 0));
 const iPhoneX = () => Platform.OS === 'ios' && (Dimensions.get('window').height === 812 || Dimensions.get('window').width === 812);

export default {
  StatusHeight,
  HeaderHeight,
  iPhoneX,
}
