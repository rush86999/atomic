import React from 'react';
import {withNavigation} from '@react-navigation/compat';
import {TouchableOpacity, StyleSheet, Platform, Dimensions} from 'react-native';
import {Block, NavBar, theme} from 'galio-framework';

import Icon from './Icon';
import materialTheme from '../constants/Theme';
import {palette} from '../theme/theme';

const {height, width} = Dimensions.get('window');
const iPhoneX = () =>
  Platform.OS === 'ios' &&
  (height === 812 || width === 812 || height === 896 || width === 896);


const NotifyButton = ({isWhite = true, style, navigation}) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={() => navigation.navigate('Pro')}>
    <Icon
      family="Entypo"
      size={16}
      name="notification"
      color={theme.COLORS[isWhite ? 'WHITE' : 'ICON']}
    />
    <Block middle style={styles.notify} />
  </TouchableOpacity>
);



class Header extends React.Component {
  handleLeftPress = () => {
    const {back, navigation} = this.props;
    return back ? navigation.goBack() : navigation.openDrawer();
  };

  renderRight = () => {
    const {white, title, navigation} = this.props;

    return <NotifyButton navigation={navigation} isWhite={white} />;


  };




  render() {
    const {back, title, white = true, transparent, navigation} = this.props;
    const headerStyles = [
      transparent
        ? {backgroundColor: 'rgba(0,0,0,0)'}
        : {backgroundColor: palette.purplePrimary},
    ];

    return (
      <Block style={headerStyles}>
        <NavBar
          back={back}
          title={title}
          style={styles.navbar}
          transparent={transparent}
          right={this.renderRight()}
          rightStyle={{alignItems: 'center'}}
          leftStyle={{flex: 0.3, paddingTop: 2}}
          leftIconName={back ? 'chevron-left' : 'navicon'}
          leftIconColor={white ? theme.COLORS.WHITE : theme.COLORS.ICON}
          titleStyle={[
            styles.title,
            {color: theme.COLORS[white ? 'WHITE' : 'ICON']},
          ]}
          onLeftPress={this.handleLeftPress}
        />
      </Block>
    );
  }
}

export default withNavigation(Header);

const styles = StyleSheet.create({
  button: {
    padding: 12,
    position: 'relative',
  },
  title: {
    width: '100%',
    fontSize: 16,
  },
  navbar: {
    paddingVertical: 0,
    paddingBottom: theme.SIZES.BASE * 1.5,
    paddingTop: iPhoneX ? theme.SIZES.BASE * 4 : theme.SIZES.BASE,
    zIndex: 5,
  },
  shadow: {
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  notify: {
    backgroundColor: materialTheme.COLORS.LABEL,
    borderRadius: 4,
    height: theme.SIZES.BASE / 2,
    width: theme.SIZES.BASE / 2,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  header: {
    backgroundColor: theme.COLORS.WHITE,
  },
  divider: {
    borderRightWidth: 0.3,
    borderRightColor: theme.COLORS.MUTED,
  },
  search: {
    height: 48,
    width: width - 32,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 3,
  },
  tabs: {
    marginBottom: 24,
    marginTop: 10,
    elevation: 4,
  },
  tab: {
    backgroundColor: theme.COLORS.TRANSPARENT,
    width: width * 0.5,
    borderRadius: 0,
    borderWidth: 0,
    height: 24,
    elevation: 0,
  },
  tabTitle: {
    lineHeight: 19,
    fontWeight: '300',
  },
});
