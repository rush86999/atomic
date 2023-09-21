

import React, { useRef, useEffect, useState, useCallback } from "react";
import cls from 'classnames'
import {ButtonScrollToBottom} from '@components/chat/button-scroll-to-bottom'

type Props = {
    scrollCta: string,
    isNewSession: boolean,
}

const ScrollContainer = ({ children, scrollCta, isNewSession }: Props & { children: any })  => {
  const outerDiv = useRef<HTMLDivElement | null>(null);
  const innerDiv = useRef<HTMLDivElement | null>(null);

  const prevInnerDivHeight = useRef(null);

  const [showMessages, setShowMessages] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const outerDivHeight = outerDiv.current.clientHeight;
    const innerDivHeight = innerDiv.current.clientHeight;
    const outerDivScrollTop = outerDiv.current.scrollTop;

    if (
      !prevInnerDivHeight.current ||
      (outerDivScrollTop === prevInnerDivHeight.current - outerDivHeight)
    ) {
      outerDiv.current.scrollTo({
        top:  innerDivHeight - outerDivHeight,
        left: 0,
        behavior: prevInnerDivHeight.current ? "smooth" : "auto"
      });
      setShowMessages(true);
    } else {
      setShowScrollButton(true);
    }

    prevInnerDivHeight.current = innerDivHeight;
  }, [children]);

  const handleScrollButtonClick = useCallback(() => {
    const outerDivHeight = outerDiv.current.clientHeight;
    const innerDivHeight = innerDiv.current.clientHeight;

    outerDiv.current.scrollTo({
      top: innerDivHeight - outerDivHeight,
      left: 0,
      behavior: "smooth"
    });

    setShowScrollButton(false);
  }, []);

  return (
    <div className="h-full w-full">
      <ButtonScrollToBottom />
      <div className={cls("relative h-full overflow-scroll w-full bg-primary-content", { 'opacity-50': isNewSession })} ref={outerDiv}>
        <div
          className="relative transition-all duration-300 bg-primary-content"
          style={{ opacity: showMessages ? 1 : 0 }}
          ref={innerDiv}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ScrollContainer

