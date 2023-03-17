import { ReactNode } from "react";

interface CardProps {
  header: string;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({ header, children }) => {
  return (
    <div className="border-top border-bottom">
      <div className="card-header">
        <h5 className="mb-0">{header}</h5>
        <i
          className="ml-2 fal fa-info-circle align-self-center"
          aria-hidden="true"
          style={{ fontSize: "medium" }}
        ></i>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};
