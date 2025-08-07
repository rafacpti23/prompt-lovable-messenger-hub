import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Upload, Image, Video, File, Trash2, Download, Copy } from "lucide-react";

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  description?: string;
  tags?: string[];
  created_at: string;
}

interface MediaRepositoryProps {
  onSelectMedia?: (media: MediaFile) => void;
  selectionMode?: boolean;
}

const MediaRepository: React.FC<MediaRepositoryProps> = ({ onSelectMedia, selectionMode = false }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaFiles();
  }, [user]);

  const fetchMediaFiles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('media_repository')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar mídia",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMediaFiles(data || []);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('media_repository')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_url: publicUrl,
          description: description || null,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setDescription('');
      setTags('');
      fetchMediaFiles();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (media: MediaFile) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('user-media')
        .remove([media.filename]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('media_repository')
        .delete()
        .eq('id', media.id);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Arquivo excluído com sucesso!",
      });

      fetchMediaFiles();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Sucesso",
      description: "URL copiada para a área de transferência!",
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Repositório de Mídia</h2>
          <p className="text-muted-foreground">
            Gerencie suas imagens e vídeos para usar em campanhas
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Novo Arquivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o arquivo..."
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (opcional)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="campanha, produto, promo (separadas por vírgula)"
                />
              </div>
              <Button 
                onClick={uploadFile} 
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? "Enviando..." : "Enviar Arquivo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaFiles.map((media) => (
          <Card key={media.id} className="overflow-hidden">
            <CardContent className="p-0">
              {media.file_type.startsWith('image/') ? (
                <img
                  src={media.file_url}
                  alt={media.original_name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted">
                  {getFileIcon(media.file_type)}
                </div>
              )}
            </CardContent>
            <CardHeader className="p-4">
              <CardTitle className="text-sm truncate">{media.original_name}</CardTitle>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(media.file_size)}
                </p>
                {media.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {media.description}
                  </p>
                )}
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {media.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {media.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{media.tags.length - 2}</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(media.file_url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(media.file_url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  {selectionMode ? (
                    <Button
                      size="sm"
                      onClick={() => onSelectMedia?.(media)}
                    >
                      Usar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFile(media)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {mediaFiles.length === 0 && (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece enviando suas primeiras imagens ou vídeos
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            Enviar Primeiro Arquivo
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaRepository;