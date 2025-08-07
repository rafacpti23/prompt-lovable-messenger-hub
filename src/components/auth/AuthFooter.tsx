import React from 'react';
import { Youtube, MessageSquare } from 'lucide-react';

const AuthFooter: React.FC = () => {
  return (
    <footer className="absolute bottom-0 left-0 w-full p-4 z-20">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-white/60 text-sm">
        <p>&copy; {new Date().getFullYear()} Ramel Tecnologia. Todos os direitos reservados.</p>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <a
            href="https://wa.me/5527999082624"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>(27) 99908-2624</span>
          </a>
          <a
            href="https://www.youtube.com/@Meltechplus"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors"
          >
            <Youtube className="h-4 w-4 mr-2" />
            <span>Mel Tech+</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;