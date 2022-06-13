import * as React from 'react';

export interface IconProps {
  className?: string;
  items?: {
    className?: string;
    id: string;
    isIntersecting: boolean;
    label: string;
    level: number;
  }[];
}

/**
 *
 */
const MiniMapIndex: React.FunctionComponent<IconProps> = ({
  className,
  items = [],
}) => (
  <ul className={className}>
    {items.map(
      ({ className: itemClassName, id, isIntersecting, label, level }) => (
        <li
          key={id}
          className={[
            itemClassName,
            `${itemClassName}--${isIntersecting ? 'on-screen' : 'off-screen'}`,
            `${itemClassName}--level-${level}`,
          ].join(' ')}
        >
          <a
            href={`#${id}`}
            // scroll-behavior: smooth; in CSS instead!
            // onClick={(event) => {
            //   // TODO - ensure ctrl click still works
            //   event.preventDefault();
            //   // scrollIntoView with behaviour may not work in safari
            //   // needs to have an offset for sticky header
            //   document
            //     .getElementById(id)
            //     ?.scrollIntoView({ behavior: 'smooth' });
            // }}
          >
            {label}
            {/* may not need sr label */}
            <span className="w-sr-only">
              {isIntersecting ? 'on screen' : 'off screen'}
            </span>
          </a>
        </li>
      ),
    )}
  </ul>
);

export default MiniMapIndex;
