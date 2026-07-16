import 'package:flutter/material.dart';
import 'design_tokens.dart';

/// Tailwind-inspired utility extensions for Flutter widgets
extension TailwindUtilities on Widget {
  // Padding utilities
  Widget p(double padding) =>
      Padding(padding: EdgeInsets.all(padding), child: this);

  Widget px(double horizontal) => Padding(
    padding: EdgeInsets.symmetric(horizontal: horizontal),
    child: this,
  );

  Widget py(double vertical) => Padding(
    padding: EdgeInsets.symmetric(vertical: vertical),
    child: this,
  );

  Widget pt(double top) => Padding(
    padding: EdgeInsets.only(top: top),
    child: this,
  );

  Widget pb(double bottom) => Padding(
    padding: EdgeInsets.only(bottom: bottom),
    child: this,
  );

  Widget pl(double left) => Padding(
    padding: EdgeInsets.only(left: left),
    child: this,
  );

  Widget pr(double right) => Padding(
    padding: EdgeInsets.only(right: right),
    child: this,
  );

  // Margin utilities (using SizedBox for spacing)
  Widget mt(double top) => Column(
    children: [
      SizedBox(height: top),
      this,
    ],
  );

  Widget mb(double bottom) => Column(
    children: [
      this,
      SizedBox(height: bottom),
    ],
  );

  Widget ml(double left) => Row(
    children: [
      SizedBox(width: left),
      this,
    ],
  );

  Widget mr(double right) => Row(
    children: [
      this,
      SizedBox(width: right),
    ],
  );

  // Flex utilities
  Widget flex([int flex = 1]) => Flexible(flex: flex, child: this);

  Widget expanded([int flex = 1]) => Expanded(flex: flex, child: this);

  // Size utilities
  Widget w(double width) => SizedBox(width: width, child: this);

  Widget h(double height) => SizedBox(height: height, child: this);

  Widget wFull() => SizedBox(width: double.infinity, child: this);

  Widget hFull() => SizedBox(height: double.infinity, child: this);
}

/// Tailwind-inspired spacing constants
class TwSpace {
  static const double px = 1.0;
  static const double s1 = AppDesignTokens.space1;
  static const double s2 = AppDesignTokens.space2;
  static const double s3 = AppDesignTokens.space3;
  static const double s4 = AppDesignTokens.space4;
  static const double s5 = AppDesignTokens.space5;
  static const double s6 = AppDesignTokens.space6;
  static const double s8 = AppDesignTokens.space8;
  static const double s10 = AppDesignTokens.space10;
  static const double s12 = AppDesignTokens.space12;
  static const double s16 = AppDesignTokens.space16;
  static const double s20 = AppDesignTokens.space20;
}

/// Tailwind-inspired border radius constants
class TwRadius {
  static const double none = 0.0;
  static const double sm = 4.0;
  static const double base = AppDesignTokens.radiusBase;
  static const double lg = AppDesignTokens.radiusLg;
  static const double xl = AppDesignTokens.radiusXl;
  static const double full = 9999.0;
}

/// Tailwind-inspired text styles
class TwText {
  static TextStyle xs({Color? color}) => TextStyle(fontSize: 12, color: color);

  static TextStyle sm({Color? color}) => TextStyle(fontSize: 14, color: color);

  static TextStyle base({Color? color}) =>
      TextStyle(fontSize: 16, color: color);

  static TextStyle lg({Color? color}) => TextStyle(fontSize: 18, color: color);

  static TextStyle xl({Color? color}) => TextStyle(fontSize: 20, color: color);

  static TextStyle xl2({Color? color}) => TextStyle(fontSize: 24, color: color);

  static TextStyle xl3({Color? color}) => TextStyle(fontSize: 30, color: color);

  static TextStyle xl4({Color? color}) => TextStyle(fontSize: 36, color: color);

  static TextStyle xl5({Color? color}) => TextStyle(fontSize: 48, color: color);
}

/// Tailwind-inspired container widget
class TwContainer extends StatelessWidget {
  final Widget child;
  final double? maxWidth;
  final EdgeInsetsGeometry? padding;

  const TwContainer({
    super.key,
    required this.child,
    this.maxWidth,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? EdgeInsets.symmetric(horizontal: TwSpace.s5),
      child: maxWidth != null
          ? Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxWidth!),
                child: child,
              ),
            )
          : child,
    );
  }
}

/// Tailwind-inspired card widget
class TwCard extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final Color? borderColor;
  final double? borderRadius;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const TwCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppDesignTokens.colorScheme(Theme.of(context).brightness);

    return Material(
      color: backgroundColor ?? colors.surface,
      borderRadius: BorderRadius.circular(borderRadius ?? TwRadius.xl),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius ?? TwRadius.xl),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: borderColor ?? colors.border, width: 1),
            borderRadius: BorderRadius.circular(borderRadius ?? TwRadius.xl),
          ),
          padding: padding ?? EdgeInsets.all(TwSpace.s4),
          child: child,
        ),
      ),
    );
  }
}

/// Tailwind-inspired button widget
class TwButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final TwButtonVariant variant;
  final TwButtonSize size;
  final bool disabled;

  const TwButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = TwButtonVariant.primary,
    this.size = TwButtonSize.medium,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppDesignTokens.colorScheme(Theme.of(context).brightness);

    Color backgroundColor;
    Color textColor;
    Color? borderColor;

    switch (variant) {
      case TwButtonVariant.primary:
        backgroundColor = colors.primary;
        textColor = colors.onPrimary;
        break;
      case TwButtonVariant.secondary:
        backgroundColor = Colors.transparent;
        textColor = colors.onBackground;
        borderColor = colors.border;
        break;
      case TwButtonVariant.danger:
        backgroundColor = AppDesignTokens.danger;
        textColor = Colors.white;
        break;
    }

    EdgeInsetsGeometry padding;
    double fontSize;

    switch (size) {
      case TwButtonSize.small:
        padding = EdgeInsets.symmetric(
          horizontal: TwSpace.s3,
          vertical: TwSpace.s2,
        );
        fontSize = 14;
        break;
      case TwButtonSize.medium:
        padding = EdgeInsets.symmetric(
          horizontal: TwSpace.s4,
          vertical: TwSpace.s2 + 2,
        );
        fontSize = 16;
        break;
      case TwButtonSize.large:
        padding = EdgeInsets.symmetric(
          horizontal: TwSpace.s6,
          vertical: TwSpace.s3,
        );
        fontSize = 18;
        break;
    }

    return Material(
      color: disabled ? colors.muted.withValues(alpha: 0.3) : backgroundColor,
      borderRadius: BorderRadius.circular(TwRadius.lg),
      child: InkWell(
        onTap: disabled ? null : onPressed,
        borderRadius: BorderRadius.circular(TwRadius.lg),
        child: Container(
          decoration: borderColor != null
              ? BoxDecoration(
                  border: Border.all(color: borderColor),
                  borderRadius: BorderRadius.circular(TwRadius.lg),
                )
              : null,
          padding: padding,
          child: Text(
            text,
            style: TextStyle(
              color: disabled ? colors.muted : textColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

enum TwButtonVariant { primary, secondary, danger }

enum TwButtonSize { small, medium, large }
