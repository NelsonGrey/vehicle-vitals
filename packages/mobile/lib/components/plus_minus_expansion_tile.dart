import 'package:flutter/material.dart';

/// An inline disclosure control that consistently uses + / −.
///
/// Navigation rows should continue to use directional chevrons because they
/// open another screen rather than revealing content in place.
class PlusMinusExpansionTile extends StatefulWidget {
  const PlusMinusExpansionTile({
    super.key,
    required this.title,
    required this.children,
    this.leading,
    this.tilePadding,
    this.childrenPadding,
    this.expandedCrossAxisAlignment,
  });

  final Widget title;
  final Widget? leading;
  final List<Widget> children;
  final EdgeInsetsGeometry? tilePadding;
  final EdgeInsetsGeometry? childrenPadding;
  final CrossAxisAlignment? expandedCrossAxisAlignment;

  @override
  State<PlusMinusExpansionTile> createState() => _PlusMinusExpansionTileState();
}

class _PlusMinusExpansionTileState extends State<PlusMinusExpansionTile> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      leading: widget.leading,
      title: widget.title,
      tilePadding: widget.tilePadding,
      childrenPadding: widget.childrenPadding,
      expandedCrossAxisAlignment: widget.expandedCrossAxisAlignment,
      onExpansionChanged: (isExpanded) {
        setState(() => _isExpanded = isExpanded);
      },
      trailing: AnimatedSwitcher(
        duration: const Duration(milliseconds: 150),
        child: Text(
          _isExpanded ? '−' : '+',
          key: ValueKey(_isExpanded),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            height: 1,
          ),
        ),
      ),
      children: widget.children,
    );
  }
}
